import React, { useState } from 'react';
import { Technician } from '../types';

interface AssignModalProps {
  label: string;
  techs: Technician[];
  defaultDate: string;
  onClose: () => void;
  onSubmit: (techId: number, date: string) => void;
}

export default function AssignModal({ label, techs, defaultDate, onClose, onSubmit }: AssignModalProps) {
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedTechId, setSelectedTechId] = useState<number | ''>(techs[0]?.id ?? '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#1a1d27] border border-[#2a2f45] rounded-lg p-5 w-[320px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[14px] font-semibold text-slate-200 mb-1">Assign to Technician</h2>
        <p className="text-[11px] text-slate-500 mb-4 truncate">{label}</p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[#2a2f45] rounded text-[13px] text-slate-200 bg-[#21253a] focus:outline-none focus:border-blue-500 [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Technician</label>
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 border border-[#2a2f45] rounded text-[13px] text-slate-200 bg-[#21253a] focus:outline-none focus:border-blue-500"
            >
              {techs.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-5 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-[12px] font-medium text-slate-400 bg-[#21253a] border border-[#2a2f45] hover:bg-[#2a2f45] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (selectedTechId && selectedDate) onSubmit(Number(selectedTechId), selectedDate); }}
            disabled={!selectedTechId || !selectedDate}
            className="px-3 py-1.5 rounded text-[12px] font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
