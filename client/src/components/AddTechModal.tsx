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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3>Add Technician</h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <label className="modal__label">
            Name *
            <input
              type="text"
              className="modal__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tech full name"
              autoFocus
            />
          </label>
          <label className="modal__label">
            Email
            <input
              type="email"
              className="modal__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tech@company.com"
            />
          </label>
          <label className="modal__label">
            Color
            <div className="color-picker">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`color-swatch ${color === c ? 'color-swatch--active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </label>
        </div>
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={!name.trim()}>
            Add Technician
          </button>
        </div>
      </div>
    </div>
  );
}
