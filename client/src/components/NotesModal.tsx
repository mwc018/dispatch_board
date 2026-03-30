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
    <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1a1d27] border border-[#2a2f45] rounded-lg shadow-2xl min-w-80 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[#2a2f45]">
          <h3 className="text-[15px] font-semibold text-slate-200">Dispatch Notes</h3>
          <button
            className="bg-transparent border-none text-[15px] cursor-pointer text-slate-500 px-1.5 py-0.5 rounded hover:bg-[#21253a] hover:text-slate-200 transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="px-[18px] py-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-[12px] font-medium text-slate-500 uppercase tracking-[0.05em]">
            Notes
            <textarea
              className="px-2.5 py-2 border border-[#2a2f45] rounded text-[14px] text-slate-200 bg-[#21253a] focus:outline-none focus:border-blue-500 resize-y font-[inherit]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Enter any dispatch notes..."
              autoFocus
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 px-[18px] py-3 border-t border-[#2a2f45]">
          <button
            className="inline-flex items-center px-3 py-1.5 bg-[#21253a] border border-[#2a2f45] text-slate-200 hover:bg-[#2a2f45] rounded text-sm font-medium cursor-pointer transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium cursor-pointer transition-colors"
            onClick={() => onSave(notes || null)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
