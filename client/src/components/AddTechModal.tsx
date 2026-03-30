import React, { useState } from 'react';
import { AddTechData } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface AddTechModalProps {
  isOpen: boolean;
  onSave: (data: AddTechData) => void;
  onClose: () => void;
}

export default function AddTechModal({ isOpen, onSave, onClose }: AddTechModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), email: email.trim() || null, color });
    setName('');
    setEmail('');
    setColor(COLORS[0]);
  };

  return (
    <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1a1d27] border border-[#2a2f45] rounded-lg shadow-2xl min-w-80 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[#2a2f45]">
          <h3 className="text-[15px] font-semibold text-slate-200">Add Technician</h3>
          <button
            className="bg-transparent border-none text-[15px] cursor-pointer text-slate-500 px-1.5 py-0.5 rounded hover:bg-[#21253a] hover:text-slate-200 transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="px-[18px] py-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-[12px] font-medium text-slate-500 uppercase tracking-[0.05em]">
            Name *
            <input
              type="text"
              className="px-2.5 py-2 border border-[#2a2f45] rounded text-[14px] text-slate-200 bg-[#21253a] focus:outline-none focus:border-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tech full name"
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[12px] font-medium text-slate-500 uppercase tracking-[0.05em]">
            Email
            <input
              type="email"
              className="px-2.5 py-2 border border-[#2a2f45] rounded text-[14px] text-slate-200 bg-[#21253a] focus:outline-none focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tech@company.com"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[12px] font-medium text-slate-500 uppercase tracking-[0.05em]">
            Color
            <div className="flex gap-2 flex-wrap mt-0.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[#1a1d27]' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
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
            className="inline-flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Add Technician
          </button>
        </div>
      </div>
    </div>
  );
}
