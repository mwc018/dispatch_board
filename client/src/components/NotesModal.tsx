import React, { useState, useEffect } from 'react';

interface NotesModalProps {
  isOpen: boolean;
  initialNotes?: string | null;
  onSave: (notes: string | null) => void;
  onClose: () => void;
}

export default function NotesModal({ isOpen, initialNotes, onSave, onClose }: NotesModalProps) {
  const [notes, setNotes] = useState(initialNotes || '');

  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3>Dispatch Notes</h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <label className="modal__label">
            Notes
            <textarea
              className="modal__textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Enter any dispatch notes..."
              autoFocus
            />
          </label>
        </div>
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={() => onSave(notes || null)}>Save</button>
        </div>
      </div>
    </div>
  );
}
