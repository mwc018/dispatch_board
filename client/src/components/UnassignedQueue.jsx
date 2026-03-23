import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ServiceOrderCard from './ServiceOrderCard';

export default function UnassignedQueue({ orders, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' });

  const items = orders.map((o) => ({ ...o, dndId: `so_${o.id}` }));

  return (
    <div className="queue-panel">
      <div className="queue-panel__header">
        <h2 className="queue-panel__title">Unassigned Queue</h2>
        <span className="queue-panel__count">{orders.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`queue-panel__list ${isOver ? 'queue-panel__list--over' : ''}`}
      >
        <SortableContext items={items.map((i) => i.dndId)} strategy={verticalListSortingStrategy}>
          {items.length === 0 && (
            <div className="queue-panel__empty">No unassigned orders</div>
          )}
          {items.map((order) => (
            <ServiceOrderCard
              key={order.dndId}
              item={order}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
