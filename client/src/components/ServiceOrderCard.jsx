import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function ServiceOrderCard({
  item,
  priority,
  scheduledTime,
  assignmentId,
  onSetTime,
  onSetNotes,
  onUnassign,
  onDelete,
  isDragging: externalDragging,
  compact,
  notes,
}) {
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
      className={`so-card ${isDragging ? 'so-card--dragging' : ''} ${compact ? 'so-card--compact' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="so-card__body">
        <div className="so-card__header">
          {priority && (
            <span className="so-card__priority">#{priority}</span>
          )}
          {scheduledTime && (
            <span className="so-card__time">{scheduledTime}</span>
          )}
          <span className="so-card__subject">{item.subject}</span>
        </div>
        {item.customer_name && (
          <div className="so-card__customer">{item.customer_name}</div>
        )}
        {item.address && (
          <div className="so-card__address">{item.address}</div>
        )}
        {item.phone && (
          <div className="so-card__phone">{item.phone}</div>
        )}
        {notes && (
          <div className="so-card__notes">{notes}</div>
        )}
        {(onSetTime || onUnassign || onDelete || onSetNotes) && (
          <div className="so-card__actions" onPointerDown={(e) => e.stopPropagation()}>
            {onSetTime && (
              <button className="so-card__btn" onClick={() => onSetTime(assignmentId, scheduledTime)} title="Set time">
                🕐 Time
              </button>
            )}
            {onSetNotes && (
              <button className="so-card__btn" onClick={() => onSetNotes(assignmentId, notes)} title="Add notes">
                📝 Notes
              </button>
            )}
            {onUnassign && (
              <button className="so-card__btn so-card__btn--danger" onClick={() => onUnassign(item.id)} title="Return to queue">
                ↩ Unassign
              </button>
            )}
            {onDelete && (
              <button className="so-card__btn so-card__btn--danger" onClick={() => onDelete(item.id)} title="Remove from board">
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
