import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ServiceOrderCard from './ServiceOrderCard';
import { TechWithAssignments, DndCardItem } from '../types';

interface TechColumnProps {
  tech: TechWithAssignments;
  allTechs: TechWithAssignments[];
  boardDate: string;
  onSetTime: (assignmentId: number | undefined, scheduledTime: string | null | undefined) => void;
  onSetNotes: (assignmentId: number | undefined, notes: string | null | undefined) => void;
  onUnassign: (id: number, techId: number) => void;
  onDeleteTech: (techId: number) => void;
  onAssignTo: (item: DndCardItem, fromTechId: number, fromDate: string) => void;
  onToggleOff: (techId: number) => void;
  onReorderItems: (techId: number, orderedAssignmentIds: number[]) => void;
  highlightedSoId?: number | null;
}

export default function TechColumn({ tech, allTechs, boardDate, onSetTime, onSetNotes, onUnassign, onDeleteTech, onAssignTo, onToggleOff, onReorderItems, highlightedSoId }: TechColumnProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `tech_${tech.id}`, disabled: !!tech.is_off });

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `tech_col_${tech.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const assignments = tech.assignments || [];
  const isOff = !!tech.is_off;

  const items: DndCardItem[] = assignments.map((a) => {
    const coAssignees = allTechs
      .filter((t) => t.id !== tech.id)
      .filter((t) => (t.assignments || []).some((ta) => ta.service_order_id === a.service_order_id))
      .map((t) => t.name);

    return {
      dndId: `assign_${a.id}`,
      id: a.service_order_id,
      assignmentId: a.id,
      zoho_id: a.zoho_id,
      so_number: a.so_number,
      subject: a.subject,
      account_name: a.account_name,
      customer_name: a.customer_name,
      address: a.address,
      phone: a.phone,
      description: a.description,
      work_requested: a.work_requested,
      priority: a.priority,
      scheduled_time: a.scheduled_time,
      notes: a.notes,
      is_completed: a.is_completed,
      coAssignees,
    };
  });

  const handleMove = (index: number, direction: -1 | 1) => {
    const newItems = [...items];
    const swapIdx = index + direction;
    [newItems[index], newItems[swapIdx]] = [newItems[swapIdx], newItems[index]];
    onReorderItems(tech.id, newItems.map((i) => i.assignmentId!));
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={`flex-1 min-w-[180px] border rounded-lg flex flex-col overflow-hidden${isOff ? ' bg-red-900/25 border-red-500/60' : ' bg-[#1a1d27] border-[#2a2f45]'}`}
    >
      <div
        className={`px-3 py-2.5 border-b border-t-[3px] flex-shrink-0 flex items-center justify-between group cursor-grab active:cursor-grabbing${isOff ? ' border-b-red-500/50 bg-red-900/30' : ' border-b-[#2a2f45]'}`}
        style={{ borderTopColor: isOff ? '#ef4444' : (tech.color || '#3b82f6') }}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-[13px] font-semibold truncate${isOff ? ' text-red-200' : ' text-slate-200'}`}>{tech.name}</span>
          {isOff && (
            <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">OFF</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          <span className="text-[11px] text-slate-500">{assignments.length} jobs</span>
          <button
            className={`transition-opacity text-[11px] font-medium leading-none px-1.5 py-px rounded border${isOff ? ' text-red-400 border-red-500/40 bg-red-500/10 hover:bg-red-500/20' : ' opacity-0 group-hover:opacity-100 text-slate-500 border-transparent hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10'}`}
            onClick={() => onToggleOff(tech.id)}
            title={isOff ? 'Mark as available' : 'Mark as off'}
          >
            {isOff ? 'Off' : 'Off'}
          </button>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400 text-[13px] leading-none px-1"
            onClick={() => onDeleteTech(tech.id)}
            title="Remove technician"
          >
            ✕
          </button>
        </div>
      </div>
      <div
        ref={setDropRef}
        className={`flex-1 overflow-y-auto p-2 flex flex-col gap-[5px] min-h-[60px] transition-all duration-150${isOff ? ' bg-red-900/15' : ''}${isOver && !isOff ? ' bg-blue-500/15 outline-dashed outline-2 outline-blue-500/60 outline-offset-[-4px] rounded scale-[1.01]' : ''}`}
      >
        <SortableContext items={items.map((i) => i.dndId)} strategy={verticalListSortingStrategy}>
          {items.length === 0 && (
            <div className="border-2 border-dashed border-[#2a2f45] rounded-lg p-4 text-center text-slate-500 text-[12px]">
              {isOff ? 'Technician is off' : 'Drop jobs here'}
            </div>
          )}
          {items.map((item, index) => (
            <ServiceOrderCard
              key={item.dndId}
              item={item}
              priority={item.priority}
              scheduledTime={item.scheduled_time}
              assignmentId={item.assignmentId}
              notes={item.notes}
              workRequested={item.work_requested}
              coAssignees={item.coAssignees}
              highlighted={highlightedSoId === item.id}
              onSetTime={onSetTime}
              onSetNotes={onSetNotes}
              onUnassign={(id) => onUnassign(id, tech.id)}
              onAssignTo={() => onAssignTo(item, tech.id, boardDate)}
              onMoveUp={index > 0 ? () => handleMove(index, -1) : undefined}
              onMoveDown={index < items.length - 1 ? () => handleMove(index, 1) : undefined}
              isCompleted={!!item.is_completed}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
