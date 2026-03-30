import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ServiceOrderCard from './ServiceOrderCard';
import { TechWithAssignments, DndCardItem } from '../types';

interface TechColumnProps {
  tech: TechWithAssignments;
  allTechs: TechWithAssignments[];
  onSetTime: (assignmentId: number | undefined, scheduledTime: string | null | undefined) => void;
  onSetNotes: (assignmentId: number | undefined, notes: string | null | undefined) => void;
  onUnassign: (id: number, techId: number) => void;
  onAlsoAssign: (serviceOrderId: number, currentTechId: number) => void;
}

export default function TechColumn({ tech, allTechs, onSetTime, onSetNotes, onUnassign, onAlsoAssign }: TechColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `tech_${tech.id}` });

  const assignments = tech.assignments || [];

  const items: DndCardItem[] = assignments.map((a) => {
    const coAssignees = allTechs
      .filter((t) => t.id !== tech.id)
      .filter((t) => (t.assignments || []).some((ta) => ta.service_order_id === a.service_order_id))
      .map((t) => t.name);

    return {
      dndId: `assign_${a.id}`,
      id: a.service_order_id,
      assignmentId: a.id,
      subject: a.subject,
      account_name: a.account_name,
      customer_name: a.customer_name,
      address: a.address,
      phone: a.phone,
      description: a.description,
      priority: a.priority,
      scheduled_time: a.scheduled_time,
      notes: a.notes,
      coAssignees,
    };
  });

  return (
    <div className="flex-1 min-w-[180px] bg-[#1a1d27] border border-[#2a2f45] rounded-lg flex flex-col overflow-hidden">
      <div
        className="px-3 py-2.5 border-b border-[#2a2f45] border-t-[3px] flex-shrink-0 flex items-center justify-between"
        style={{ borderTopColor: tech.color || '#3b82f6' }}
      >
        <span className="text-[13px] font-semibold text-slate-200">{tech.name}</span>
        <span className="text-[11px] text-slate-500">{assignments.length} jobs</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-2 flex flex-col gap-[5px] min-h-[60px] transition-colors${isOver ? ' bg-blue-500/10 outline-dashed outline-2 outline-blue-500/40 outline-offset-[-4px] rounded' : ''}`}
      >
        <SortableContext items={items.map((i) => i.dndId)} strategy={verticalListSortingStrategy}>
          {items.length === 0 && (
            <div className="border-2 border-dashed border-[#2a2f45] rounded-lg p-4 text-center text-slate-500 text-[12px]">
              Drop jobs here
            </div>
          )}
          {items.map((item) => (
            <ServiceOrderCard
              key={item.dndId}
              item={item}
              priority={item.priority}
              scheduledTime={item.scheduled_time}
              assignmentId={item.assignmentId}
              notes={item.notes}
              coAssignees={item.coAssignees}
              onSetTime={onSetTime}
              onSetNotes={onSetNotes}
              onUnassign={(id) => onUnassign(id, tech.id)}
              onAlsoAssign={() => onAlsoAssign(item.id, tech.id)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
