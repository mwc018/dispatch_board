import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ServiceOrderCard from './ServiceOrderCard';
import { ServiceOrder } from '../types';

interface UnassignedQueueProps {
  orders: ServiceOrder[];
  onDelete: (id: number) => void;
}

export default function UnassignedQueue({ orders, onDelete }: UnassignedQueueProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' });
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? orders.filter((o) =>
        (o.so_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.subject || '').toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  const items = filtered.map((o) => ({ ...o, dndId: `so_${o.id}` }));

  return (
    <div className="w-[270px] min-w-[270px] bg-[#1a1d27] border-r border-[#2a2f45] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#2a2f45] flex-shrink-0">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Open Service Orders
        </h2>
        <span className="bg-[#21253a] text-slate-500 border border-[#2a2f45] rounded-full text-[11px] font-semibold px-[7px] py-px">
          {orders.length}
        </span>
      </div>
      <div className="px-2 py-1.5 border-b border-[#2a2f45] flex-shrink-0">
        <input
          type="text"
          placeholder="Search by order # or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-[#21253a] border border-[#2a2f45] rounded text-[12px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-2 flex flex-col gap-[5px] min-h-[60px] transition-all duration-150${isOver ? ' bg-blue-500/15 outline-dashed outline-2 outline-blue-500/60 outline-offset-[-4px] rounded' : ''}`}
      >
        <SortableContext items={items.map((i) => i.dndId)} strategy={verticalListSortingStrategy}>
          {items.length === 0 && (
            <div className="text-slate-500 text-[12px] text-center py-5">
              {search.trim() ? 'No matching orders' : 'No unassigned orders'}
            </div>
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
