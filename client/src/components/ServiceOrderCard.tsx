import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndCardItem } from '../types';

interface ServiceOrderCardProps {
  item: DndCardItem;
  priority?: number;
  scheduledTime?: string | null;
  assignmentId?: number;
  onSetTime?: (assignmentId: number | undefined, scheduledTime: string | null | undefined) => void;
  onSetNotes?: (assignmentId: number | undefined, notes: string | null | undefined) => void;
  onUnassign?: (id: number) => void;
  onDelete?: (id: number) => void;
  onAlsoAssign?: () => void;
  compact?: boolean;
  notes?: string | null;
  coAssignees?: string[];
}

export default function ServiceOrderCard({
  item,
  priority,
  scheduledTime,
  assignmentId,
  onSetTime,
  onSetNotes,
  onUnassign,
  onDelete,
  onAlsoAssign,
  compact,
  notes,
  coAssignees,
}: ServiceOrderCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.dndId || String(item.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[#21253a] border border-[#2a2f45] rounded-lg shadow-sm flex items-start gap-1 p-[7px] cursor-grab transition-colors select-none group hover:border-[#3a4060] hover:shadow-md${isDragging ? ' border-blue-500 bg-[#1e2540] shadow-2xl' : ''}${compact ? '' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex-none w-full">
        <div className="flex items-center gap-1 flex-wrap mb-[3px]">
          {priority && (
            <span className="bg-white/[0.12] text-slate-200 text-[10px] font-bold px-1.5 py-px rounded-full flex-shrink-0 tracking-[0.03em]">
              #{priority}
            </span>
          )}
          {scheduledTime && (
            <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-1.5 py-px rounded-full flex-shrink-0">
              {scheduledTime}
            </span>
          )}
          <span className="text-[12px] font-semibold text-slate-200 whitespace-nowrap">{item.subject}</span>
          <div
            className="ml-auto flex items-center gap-0.5 flex-shrink-0"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {onAlsoAssign && (
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border border-transparent px-1 py-px rounded text-[11px] text-slate-500 hover:text-blue-400 hover:border-blue-500 hover:bg-blue-500/10 leading-none"
                onClick={(e) => { e.stopPropagation(); onAlsoAssign(); }}
                title="Also assign to another tech"
              >
                +
              </button>
            )}
            {onUnassign && (
              <button
                className="[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity bg-transparent border border-transparent px-1 py-px rounded text-[11px] text-slate-500 hover:text-red-400 hover:border-red-500 hover:bg-red-500/10 active:text-red-400 active:border-red-500 leading-none"
                onClick={(e) => { e.stopPropagation(); onUnassign(item.id); }}
                title="Return to queue"
              >
                ↩
              </button>
            )}
            {onDelete && (
              <button
                className="[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity bg-transparent border border-transparent px-1 py-px rounded text-[11px] text-slate-500 hover:text-red-400 hover:border-red-500 hover:bg-red-500/10 active:text-red-400 active:border-red-500 leading-none"
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                title="Remove from board"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {item.account_name && (
          <div className="text-[12px] font-semibold text-slate-400 whitespace-nowrap">{item.account_name}</div>
        )}
        {item.customer_name && (
          <div className="text-[11px] text-slate-500 whitespace-nowrap">{item.customer_name}</div>
        )}
        {item.address && (
          <div className="text-[10px] text-slate-500 whitespace-nowrap">{item.address}</div>
        )}
        {item.phone && (
          <div className="text-[10px] text-slate-500">{item.phone}</div>
        )}

        {item.description && (
          <div className="text-[11px] text-slate-400 mt-1 pt-1 border-t border-[#2a2f45] whitespace-pre-wrap leading-[1.4]">
            {item.description}
          </div>
        )}

        {notes && (
          <div className="text-[10px] text-amber-400 bg-amber-400/10 rounded px-1 py-0.5 mt-[3px] whitespace-nowrap">
            {notes}
          </div>
        )}

        {coAssignees && coAssignees.length > 0 && (
          <div className="text-[10px] text-slate-500 mt-1">
            Also: {coAssignees.join(', ')}
          </div>
        )}

        {(onSetTime || onSetNotes) && (
          <div
            className="flex flex-row gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity items-center mt-2 pt-2 border-t border-[#2a2f45]"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {onSetTime && (
              <button
                className="bg-[#1a1d27] border border-[#2a2f45] px-2.5 py-1 rounded text-[11px] font-medium text-slate-400 cursor-pointer transition-colors hover:bg-[#2a2f45] hover:text-slate-200 hover:border-[#3a4060] whitespace-nowrap leading-none"
                onClick={() => onSetTime(assignmentId, scheduledTime)}
                title="Set time"
              >
                🕐 Time
              </button>
            )}
            {onSetNotes && (
              <button
                className="bg-[#1a1d27] border border-[#2a2f45] px-2.5 py-1 rounded text-[11px] font-medium text-slate-400 cursor-pointer transition-colors hover:bg-[#2a2f45] hover:text-slate-200 hover:border-[#3a4060] whitespace-nowrap leading-none"
                onClick={() => onSetNotes(assignmentId, notes)}
                title="Add notes"
              >
                📝 Notes
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
