import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';

// Use pointer position first, fall back to closest corners
function collisionDetection(args: Parameters<typeof pointerWithin>[0]) {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return closestCorners(args);
}
import { arrayMove } from '@dnd-kit/sortable';

import UnassignedQueue from '../components/UnassignedQueue';
import TechColumn from '../components/TechColumn';
import ServiceOrderCard from '../components/ServiceOrderCard';
import TimeModal from '../components/TimeModal';
import NotesModal from '../components/NotesModal';
import AddTechModal from '../components/AddTechModal';
import AlsoAssignModal from '../components/AlsoAssignModal';
import { useSocket } from '../hooks/useSocket';
import {
  getBoard,
  assignOrder,
  unassignOrder,
  alsoAssign,
  reorderUnassigned,
  reorderTech,
  setTime,
  setNotes,
  addTechnician,
  syncZohoTechs,
  deleteServiceOrder,
  addServiceOrder,
} from '../api/client';
import { BoardState, DndCardItem, AddTechData, AddOrderData, DispatchAssignment } from '../types';

interface TimeModalState {
  assignmentId: number;
  currentTime: string | null;
}

interface NotesModalState {
  assignmentId: number;
  currentNotes: string | null;
}

export default function ManagerBoard() {
  const { user, logout } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [board, setBoard] = useState<BoardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeItem, setActiveItem] = useState<DndCardItem | null>(null);
  const [timeModal, setTimeModal] = useState<TimeModalState | null>(null);
  const [notesModal, setNotesModal] = useState<NotesModalState | null>(null);
  const [addTechOpen, setAddTechOpen] = useState(false);
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const [alsoAssignModal, setAlsoAssignModal] = useState<{ serviceOrderId: number; currentTechId: number } | null>(null);
  const [newOrder, setNewOrder] = useState<AddOrderData>({ subject: '', customer_name: '', address: '', phone: '', description: '' });

  const fetchBoard = useCallback(async () => {
    try {
      const data = await getBoard(date);
      setBoard(data);
      setError(null);
    } catch {
      setError('Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    setLoading(true);
    fetchBoard();
  }, [fetchBoard]);

  useSocket(
    date,
    (updatedBoard) => setBoard(updatedBoard),
    () => fetchBoard()
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Find the container (unassigned or tech id) for a given dnd item id
  function findContainer(dndId: string): string | null {
    if (!board) return null;
    if (board.unassigned.some((o) => `so_${o.id}` === dndId)) return 'unassigned';
    for (const tech of board.technicians) {
      if ((tech.assignments || []).some((a) => `assign_${a.id}` === dndId)) return `tech_${tech.id}`;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const dndId = String(active.id);
    // Find the raw item
    const fromUnassigned = board?.unassigned.find((o) => `so_${o.id}` === dndId);
    if (fromUnassigned) {
      setActiveItem({ ...fromUnassigned, dndId });
      return;
    }
    for (const tech of board?.technicians || []) {
      const a = (tech.assignments || []).find((a) => `assign_${a.id}` === dndId);
      if (a) {
        setActiveItem({ ...a, id: a.service_order_id, dndId });
        return;
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveItem(null);
    if (!over || !board) return;

    const activeDndId = String(active.id);
    const overDndId = String(over.id);

    const sourceContainer = findContainer(activeDndId);
    // over can be a container (droppable) or an item
    let targetContainer: string | null = overDndId; // e.g., 'unassigned', 'tech_3'
    if (!['unassigned'].concat(board.technicians.map((t) => `tech_${t.id}`)).includes(targetContainer)) {
      targetContainer = findContainer(overDndId);
    }

    if (!sourceContainer || !targetContainer) return;

    // --- Same container reorder ---
    if (sourceContainer === targetContainer) {
      if (sourceContainer === 'unassigned') {
        const ids = board.unassigned.map((o) => o.id);
        const fromIdx = board.unassigned.findIndex((o) => `so_${o.id}` === activeDndId);
        const toIdx = board.unassigned.findIndex((o) => `so_${o.id}` === overDndId);
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
        const newOrderedIds = arrayMove(ids, fromIdx, toIdx);
        // Optimistic update
        setBoard((b) => b ? { ...b, unassigned: arrayMove(b.unassigned, fromIdx, toIdx) } : b);
        await reorderUnassigned(newOrderedIds, date);
      } else {
        const techId = parseInt(sourceContainer.replace('tech_', ''));
        const tech = board.technicians.find((t) => t.id === techId);
        const assignments = tech?.assignments || [];
        const fromIdx = assignments.findIndex((a) => `assign_${a.id}` === activeDndId);
        const toIdx = assignments.findIndex((a) => `assign_${a.id}` === overDndId);
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
        const newAssignments = arrayMove(assignments, fromIdx, toIdx);
        // Optimistic update
        setBoard((b) => b ? ({
          ...b,
          technicians: b.technicians.map((t) =>
            t.id === techId ? { ...t, assignments: newAssignments } : t
          ),
        }) : b);
        await reorderTech(techId, date, newAssignments.map((a) => a.id));
      }
      return;
    }

    // --- Cross-container move ---
    // Moving from unassigned → tech
    if (sourceContainer === 'unassigned' && targetContainer.startsWith('tech_')) {
      const techId = parseInt(targetContainer.replace('tech_', ''));
      const order = board.unassigned.find((o) => `so_${o.id}` === activeDndId);
      if (!order) return;
      await assignOrder({ service_order_id: order.id, technician_id: techId, date });
    }

    // Moving from tech → unassigned
    if (sourceContainer.startsWith('tech_') && targetContainer === 'unassigned') {
      const assignment = findAssignmentByDndId(activeDndId);
      if (!assignment) return;
      // Find where in the queue the item was dropped
      const dropIdx = board.unassigned.findIndex((o) => `so_${o.id}` === overDndId);
      const position = dropIdx >= 0 ? dropIdx : undefined;
      const sourceTechId = parseInt(sourceContainer.replace('tech_', ''));
      await unassignOrder(assignment.service_order_id, date, position, sourceTechId);
    }

    // Moving from tech → different tech
    if (sourceContainer.startsWith('tech_') && targetContainer.startsWith('tech_') && sourceContainer !== targetContainer) {
      const targetTechId = parseInt(targetContainer.replace('tech_', ''));
      const assignment = findAssignmentByDndId(activeDndId);
      if (assignment) await assignOrder({ service_order_id: assignment.service_order_id, technician_id: targetTechId, date });
    }
  }

  function findAssignmentByDndId(dndId: string): DispatchAssignment | undefined {
    for (const tech of board?.technicians || []) {
      const a = (tech.assignments || []).find((a) => `assign_${a.id}` === dndId);
      if (a) return a;
    }
    return undefined;
  }

  const handleSetTime = (assignmentId: number | undefined, currentTime: string | null | undefined) => {
    if (assignmentId === undefined) return;
    setTimeModal({ assignmentId, currentTime: currentTime ?? null });
  };

  const handleTimeSave = async (newTime: string | null) => {
    if (!timeModal) return;
    await setTime(timeModal.assignmentId, newTime, date);
    setTimeModal(null);
  };

  const handleSetNotes = (assignmentId: number | undefined, currentNotes: string | null | undefined) => {
    if (assignmentId === undefined) return;
    setNotesModal({ assignmentId, currentNotes: currentNotes ?? null });
  };

  const handleNotesSave = async (newNotes: string | null) => {
    if (!notesModal) return;
    await setNotes(notesModal.assignmentId, newNotes, date);
    setNotesModal(null);
  };

  const handleUnassign = async (serviceOrderId: number, techId: number) => {
    await unassignOrder(serviceOrderId, date, undefined, techId);
  };

  const handleAlsoAssign = (serviceOrderId: number, currentTechId: number) => {
    setAlsoAssignModal({ serviceOrderId, currentTechId });
  };

  const handleAlsoAssignSave = async (targetTechId: number) => {
    if (!alsoAssignModal) return;
    await alsoAssign(alsoAssignModal.serviceOrderId, targetTechId, date);
    setAlsoAssignModal(null);
  };

  const handleDelete = async (serviceOrderId: number) => {
    if (!confirm('Remove this service order from the board?')) return;
    await deleteServiceOrder(serviceOrderId);
  };

  const handleAddTech = async (data: AddTechData) => {
    await addTechnician(data);
    setAddTechOpen(false);
  };

  const handleSyncZoho = async () => {
    const result = await syncZohoTechs();
    alert(`Synced ${result.added} new technicians from Zoho.`);
  };

  const handleAddOrder = async () => {
    if (!newOrder.subject.trim()) return;
    await addServiceOrder(newOrder);
    setNewOrder({ subject: '', customer_name: '', address: '', phone: '', description: '' });
    setAddOrderOpen(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-slate-500 text-[15px]">
      Loading dispatch board...
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-screen text-red-400 text-[15px]">
      {error}
    </div>
  );
  if (!board) return null;

  return (
    <div className="flex flex-col h-screen bg-[#0f1117] overflow-hidden">
      {/* Board Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1d27] border-b border-[#2a2f45] flex-shrink-0">
        <h1 className="text-base font-bold text-slate-200 tracking-wide">Dispatch Board</h1>
        {user && (
          <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-[#2a2f45]">
            <span className="text-[13px] text-slate-400">{user.name}</span>
            <button
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-transparent border border-[#2a2f45] text-slate-500 hover:bg-[#21253a] hover:text-slate-400 rounded text-[12px] font-medium cursor-pointer transition-colors"
              onClick={logout}
            >
              Sign out
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="px-2.5 py-1 border border-[#2a2f45] rounded text-[13px] text-slate-200 bg-[#21253a] focus:outline-none focus:border-blue-500 [color-scheme:dark]"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#21253a] border border-[#2a2f45] text-slate-200 hover:bg-[#2a2f45] rounded text-[12px] font-medium cursor-pointer transition-colors"
            onClick={() => setAddOrderOpen(true)}
          >
            + Service Order
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#21253a] border border-[#2a2f45] text-slate-200 hover:bg-[#2a2f45] rounded text-[12px] font-medium cursor-pointer transition-colors"
            onClick={() => setAddTechOpen(true)}
          >
            + Technician
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-transparent border border-[#2a2f45] text-slate-500 hover:bg-[#21253a] hover:text-slate-400 rounded text-[12px] cursor-pointer transition-colors"
            onClick={handleSyncZoho}
            title="Sync technicians from Zoho CRM"
          >
            ⟳ Sync Zoho Techs
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Board Layout */}
        <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 53px)' }}>
          <UnassignedQueue
            orders={board.unassigned}
            onDelete={handleDelete}
          />
          <div className="flex flex-1 overflow-x-auto overflow-y-hidden gap-2 p-2 bg-[#0f1117]">
            {board.technicians.map((tech) => (
              <TechColumn
                key={tech.id}
                tech={tech}
                allTechs={board.technicians}
                onSetTime={handleSetTime}
                onSetNotes={handleSetNotes}
                onUnassign={handleUnassign}
                onAlsoAssign={handleAlsoAssign}
              />
            ))}
            {board.technicians.length === 0 && (
              <div className="flex items-center justify-center flex-1 text-slate-500 text-[14px]">
                No technicians yet. Add one to start dispatching.
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeItem && (
            <ServiceOrderCard item={activeItem} compact />
          )}
        </DragOverlay>
      </DndContext>

      <TimeModal
        isOpen={!!timeModal}
        initialTime={timeModal?.currentTime}
        onSave={handleTimeSave}
        onClose={() => setTimeModal(null)}
      />
      <NotesModal
        isOpen={!!notesModal}
        initialNotes={notesModal?.currentNotes}
        onSave={handleNotesSave}
        onClose={() => setNotesModal(null)}
      />
      <AddTechModal
        isOpen={addTechOpen}
        onSave={handleAddTech}
        onClose={() => setAddTechOpen(false)}
      />
      <AlsoAssignModal
        isOpen={!!alsoAssignModal}
        onClose={() => setAlsoAssignModal(null)}
        onAssign={handleAlsoAssignSave}
        availableTechs={
          alsoAssignModal
            ? board.technicians.filter((t) =>
                t.id !== alsoAssignModal.currentTechId &&
                !(t.assignments || []).some((a) => a.service_order_id === alsoAssignModal.serviceOrderId)
              )
            : []
        }
      />

      {addOrderOpen && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setAddOrderOpen(false)}>
          <div className="bg-[#1a1d27] border border-[#2a2f45] rounded-lg shadow-2xl min-w-80 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[#2a2f45]">
              <h3 className="text-[15px] font-semibold text-slate-200">Add Service Order</h3>
              <button
                className="bg-none border-none text-[15px] cursor-pointer text-slate-500 px-1.5 py-0.5 rounded hover:bg-[#21253a] hover:text-slate-200 transition-colors"
                onClick={() => setAddOrderOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="px-[18px] py-4 flex flex-col gap-3">
              {(['subject', 'customer_name', 'address', 'phone', 'description'] as const).map((field) => (
                <label key={field} className="flex flex-col gap-1 text-[12px] font-medium text-slate-500 uppercase tracking-[0.05em]">
                  {field.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  {field === 'description'
                    ? <textarea
                        className="px-2.5 py-2 border border-[#2a2f45] rounded text-[14px] text-slate-200 bg-[#21253a] focus:outline-none focus:border-blue-500 resize-y font-[inherit]"
                        value={newOrder[field]}
                        onChange={(e) => setNewOrder((o) => ({ ...o, [field]: e.target.value }))}
                        rows={3}
                      />
                    : <input
                        type="text"
                        className="px-2.5 py-2 border border-[#2a2f45] rounded text-[14px] text-slate-200 bg-[#21253a] focus:outline-none focus:border-blue-500"
                        value={newOrder[field]}
                        onChange={(e) => setNewOrder((o) => ({ ...o, [field]: e.target.value }))}
                      />
                  }
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 px-[18px] py-3 border-t border-[#2a2f45]">
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#21253a] border border-[#2a2f45] text-slate-200 hover:bg-[#2a2f45] rounded text-sm font-medium cursor-pointer transition-colors"
                onClick={() => setAddOrderOpen(false)}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleAddOrder}
                disabled={!newOrder.subject.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
