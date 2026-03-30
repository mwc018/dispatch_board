import React, { useState, useEffect } from 'react';

interface TimeModalProps {
  isOpen: boolean;
  initialTime?: string | null;
  onSave: (time: string | null) => void;
  onClose: () => void;
  title?: string;
}

export default function TimeModal({ isOpen, initialTime, onSave, onClose, title }: TimeModalProps) {
  const [time, setTime] = useState(initialTime || '');

  useEffect(() => {
    setTime(initialTime || '');
  }, [initialTime, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3>{title || 'Set Scheduled Time'}</h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <label className="modal__label">
            Time
            <input
              type="time"
              className="modal__input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              autoFocus
            />
          </label>
        </div>
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={() => onSave(null)}>
            Clear Time
          </button>
          <button className="btn btn--primary" onClick={() => onSave(time || null)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
