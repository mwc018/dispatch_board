import React from 'react';
import { TechWithAssignments } from '../types';

interface AlsoAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (techId: number) => void;
  availableTechs: TechWithAssignments[];
}

export default function AlsoAssignModal({ isOpen, onClose, onAssign, availableTechs }: AlsoAssignModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1a1d27] border border-[#2a2f45] rounded-lg shadow-2xl w-72" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[#2a2f45]">
          <h3 className="text-[15px] font-semibold text-slate-200">Also assign to...</h3>
          <button
            className="bg-transparent border-none text-[15px] cursor-pointer text-slate-500 px-1.5 py-0.5 rounded hover:bg-[#21253a] hover:text-slate-200 transition-colors"
            onClick={onClose}
          >✕</button>
        </div>
        <div className="py-1">
          {availableTechs.length === 0 ? (
            <div className="px-4 py-3 text-[13px] text-slate-500">All techs already assigned.</div>
          ) : (
            availableTechs.map((tech) => (
              <button
                key={tech.id}
                className="w-full text-left px-4 py-2.5 text-[13px] text-slate-200 hover:bg-[#21253a] transition-colors flex items-center gap-2.5 cursor-pointer"
                onClick={() => { onAssign(tech.id); onClose(); }}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: tech.color }} />
                {tech.name}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
