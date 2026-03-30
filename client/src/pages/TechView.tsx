import React, { useState, useEffect, useCallback } from 'react';
import { getTechBoard, getTechnicians } from '../api/client';
import { useSocket } from '../hooks/useSocket';
import { TechBoardState, Technician } from '../types';

interface TechViewProps {
  techId?: string;
}

export default function TechView({ techId: propTechId }: TechViewProps) {
  const params = new URLSearchParams(window.location.search);
  const techId = propTechId || params.get('techId');
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [data, setData] = useState<TechBoardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [selectedTechId, setSelectedTechId] = useState(techId || '');

  const fetchData = useCallback(async () => {
    if (!selectedTechId) return;
    try {
      const result = await getTechBoard(selectedTechId, date);
      setData(result);
      setError(null);
    } catch {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [selectedTechId, date]);

  useEffect(() => {
    getTechnicians().then(setTechs).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useSocket(date, () => fetchData(), () => fetchData());

  const formatTime = (t: string | null): string | null => {
    if (!t) return null;
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-[#0f1117] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 bg-[#1a1d27] px-[18px] py-3.5 rounded-lg border border-[#2a2f45] shadow-sm">
        <h1 className="text-lg font-bold text-slate-200">
          {data?.tech ? `${data.tech.name}'s Jobs` : 'Tech View'}
        </h1>
        <div className="flex gap-2.5 items-center">
          {!techId && (
            <select
              className="px-2.5 py-[7px] border border-[#2a2f45] rounded text-[13px] bg-[#21253a] text-slate-200 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
            >
              <option value="">Select technician...</option>
              {techs.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          <input
            type="date"
            className="px-2.5 py-[7px] border border-[#2a2f45] rounded text-[13px] bg-[#21253a] text-slate-200 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {!selectedTechId && (
        <div className="text-center p-10 text-slate-500 text-[14px]">
          Select a technician to view their assignments.
        </div>
      )}

      {selectedTechId && loading && (
        <div className="text-center p-10 text-slate-500 text-[14px]">
          Loading assignments...
        </div>
      )}

      {error && (
        <div className="text-center p-10 text-red-400 text-[14px]">{error}</div>
      )}

      {data && !loading && (
        <div className="flex flex-col gap-2.5">
          {data.assignments.length === 0 ? (
            <div className="text-center p-10 text-slate-500 text-[14px]">
              No jobs assigned for {date}.
            </div>
          ) : (
            data.assignments.map((a, i) => (
              <div key={a.id} className="bg-[#1a1d27] border border-[#2a2f45] rounded-lg shadow-sm flex overflow-hidden">
                <div className="bg-[#21253a] border-r border-[#2a2f45] text-slate-400 text-[20px] font-bold px-[18px] py-4 flex items-center justify-center flex-shrink-0 min-w-[56px]">
                  #{a.priority || i + 1}
                </div>
                <div className="p-4 flex-1">
                  <div className="flex items-center gap-2.5 mb-1">
                    {a.scheduled_time && (
                      <span className="bg-blue-500/20 text-blue-300 text-[12px] font-bold px-2.5 py-0.5 rounded-full">
                        {formatTime(a.scheduled_time)}
                      </span>
                    )}
                    <span className="text-[15px] font-semibold text-slate-200">{a.subject}</span>
                  </div>
                  {a.customer_name && (
                    <div className="text-[13px] text-slate-400 mb-0.5">{a.customer_name}</div>
                  )}
                  {a.address && (
                    <div className="text-[12px] mb-0.5">
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(a.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 no-underline hover:underline"
                      >
                        {a.address}
                      </a>
                    </div>
                  )}
                  {a.phone && <div className="text-[12px] text-slate-500 mb-0.5">{a.phone}</div>}
                  {a.description && <div className="text-[12px] text-slate-500 mt-1">{a.description}</div>}
                  {a.notes && (
                    <div className="text-[12px] text-amber-400 bg-amber-400/10 rounded px-2 py-1 mt-1.5">
                      📝 {a.notes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
