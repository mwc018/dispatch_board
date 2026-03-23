import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ServiceOrderCard from './ServiceOrderCard';

export default function TechColumn({ tech, onSetTime, onSetNotes, onUnassign }) {
  const { setNodeRef, isOver } = useDroppable({ id: `tech_${tech.id}` });

  const assignments = tech.assignments || [];

  // Build sortable items — use assignment id as dnd id to distinguish from unassigned
  const items = assignments.map((a) => ({
    dndId: `assign_${a.id}`,
    id: a.service_order_id,
    assignmentId: a.id,
    subject: a.subject,
    customer_name: a.customer_name,
    address: a.address,
    phone: a.phone,
    priority: a.priority,
    scheduled_time: a.scheduled_time,
    notes: a.notes,
  }));

  const techColor = tech.color || '#3b82f6';

  return (
    <div className="tech-column">
      <div className="tech-column__header" style={{ borderTopColor: techColor }}>
        <span className="tech-column__name">{tech.name}</span>
        <span className="tech-column__count">{assignments.length} jobs</span>
      </div>
      <div
        ref={setNodeRef}
        className={`tech-column__list ${isOver ? 'tech-column__list--over' : ''}`}
      >
        <SortableContext items={items.map((i) => i.dndId)} strategy={verticalListSortingStrategy}>
          {items.length === 0 && (
            <div className="tech-column__empty">Drop jobs here</div>
          )}
          {items.map((item) => (
            <ServiceOrderCard
              key={item.dndId}
              item={item}
              priority={item.priority}
              scheduledTime={item.scheduled_time}
              assignmentId={item.assignmentId}
              notes={item.notes}
              onSetTime={onSetTime}
              onSetNotes={onSetNotes}
              onUnassign={onUnassign}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
