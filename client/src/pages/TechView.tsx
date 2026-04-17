import React, { useState, useEffect, useCallback } from 'react';
import { getTechBoard, getTechnicians, setNotes, setTimeWorked, completeAssignment } from '../api/client';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { TechBoardState, Technician } from '../types';
import NotesModal from '../components/NotesModal';
import { useToast } from '../components/Toast';

interface TechViewProps {
  techId?: string;
}

export default function TechView({ techId: propTechId }: TechViewProps) {
  const { logout } = useAuth();
  const toast = useToast();
  const params = new URLSearchParams(window.location.search);
  const techId = propTechId || params.get('techId');
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [data, setData] = useState<TechBoardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [selectedTechId, setSelectedTechId] = useState(techId || '');
  const [notesModal, setNotesModal] = useState<{ assignmentId: number; currentNotes: string | null } | null>(null);
  const [timeModal, setTimeModal] = useState<{ assignmentId: number; current: number } | null>(null);
  const [timeInput, setTimeInput] = useState({ arrival: '', departure: '' });
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);

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

  function formatTimeWorked(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  const handleNotesSave = async (newNotes: string | null) => {
    if (!notesModal) return;
    await setNotes(notesModal.assignmentId, newNotes, date);
    setNotesModal(null);
    toast.success('Notes saved');
    fetchData();
  };

  const handleTimeAdd = async () => {
    if (!timeModal) return;
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const arrival = timeInput.arrival;
    const departure = timeInput.departure;
    if (!arrival || !departure) {
      toast.error('Please enter both arrival and departure times');
      return;
    }
    const added = toMinutes(departure) - toMinutes(arrival);
    if (added <= 0) {
      toast.error('Departure must be after arrival');
      return;
    }
    const snapshot = { ...timeModal };
    const newTotal = snapshot.current + added;
    try {
      await setTimeWorked(snapshot.assignmentId, newTotal, date);
      setTimeModal(null);
      setTimeInput({ arrival: '', departure: '' });
      toast.success(`Added ${formatTimeWorked(added)} — total ${formatTimeWorked(newTotal)}`);
      fetchData();
    } catch {
      toast.error('Failed to save time — please try again');
    }
  };

  const handleComplete = (assignmentId: number) => {
    toast.confirm('Mark this job as complete?', async () => {
      setCompletingId(assignmentId);
      setCompleting(assignmentId);
      setTimeout(async () => {
        try {
          await completeAssignment(assignmentId, date);
          toast.success('Job marked as complete');
          fetchData();
        } catch {
          toast.error('Failed to complete job');
        } finally {
          setCompleting(null);
          setCompletingId(null);
        }
      }, 350);
    });
  };

  return (
    <div className="min-h-screen bg-[#0f1117] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 bg-[#1a1d27] px-[18px] py-3.5 rounded-lg border border-[#2a2f45] shadow-sm">
        <h1 className="text-lg font-bold text-slate-200">
          {data?.tech ? `${data.tech.name}'s Jobs` : 'Tech View'}
        </h1>
        <div className="flex gap-2.5 items-center">
          <button
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-transparent border border-[#2a2f45] text-slate-500 hover:bg-[#21253a] hover:text-slate-400 rounded text-[12px] font-medium cursor-pointer transition-colors"
            onClick={logout}
          >
            Sign out
          </button>
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
              <div
                key={a.id}
                className={`bg-[#1a1d27] border border-[#2a2f45] rounded-lg shadow-sm flex overflow-hidden transition-all duration-300 ${completingId === a.id ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'}`}
              >
                <div className="bg-[#21253a] border-r border-[#2a2f45] text-slate-400 text-[20px] font-bold px-[18px] py-4 flex items-center justify-center flex-shrink-0 min-w-[56px]">
                  #{a.priority || i + 1}
                </div>
                <div className="p-4 flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-2.5 mb-2">
                    {a.scheduled_time && (
                      <span className="bg-blue-500/20 text-blue-300 text-[12px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0">
                        {formatTime(a.scheduled_time)}
                      </span>
                    )}
                    <span className="text-[15px] font-semibold text-slate-200">{a.subject}</span>
                    <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                      <button
                        className="px-3 py-1.5 bg-[#21253a] border border-[#2a2f45] text-slate-400 hover:text-slate-200 hover:border-[#3a4060] rounded text-[12px] font-medium cursor-pointer transition-colors"
                        onClick={() => setNotesModal({ assignmentId: a.id, currentNotes: a.notes })}
                      >
                        📝 Notes
                      </button>
                      <button
                        className="px-3 py-1.5 bg-[#21253a] border border-[#2a2f45] text-slate-400 hover:text-slate-200 hover:border-[#3a4060] rounded text-[12px] font-medium cursor-pointer transition-colors"
                        onClick={() => { setTimeModal({ assignmentId: a.id, current: a.time_worked || 0 }); setTimeInput({ arrival: '', departure: '' }); }}
                      >
                        {a.time_worked ? `⏱ ${formatTimeWorked(a.time_worked)}` : '⏱ Add Time'}
                      </button>
                      <button
                        className="px-3 py-1.5 bg-green-600/20 border border-green-600/40 text-green-400 hover:bg-green-600/30 hover:border-green-500 rounded text-[12px] font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        onClick={() => handleComplete(a.id)}
                        disabled={completing === a.id}
                      >
                        {completing === a.id ? (
                          <>
                            <span className="w-3 h-3 border-2 border-green-400/40 border-t-green-400 rounded-full animate-spin" />
                            Completing...
                          </>
                        ) : '✓ Complete'}
                      </button>
                    </div>
                  </div>
                  {/* Two-column detail row */}
                  <div className="grid grid-cols-2 gap-x-4">
                    <div className="min-w-0">
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
                      {a.phone && (
                        <div className="text-[12px] text-slate-500">{a.phone}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      {a.notes && (
                        <div className="text-[12px] text-amber-400 bg-amber-400/10 rounded px-2 py-1">
                          📝 {a.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  {a.description && (
                    <div className="text-[15px] text-slate-300 leading-[1.6] text-center mt-2 pt-2 border-t border-[#2a2f45]">
                      {a.description}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <NotesModal
        isOpen={!!notesModal}
        initialNotes={notesModal?.currentNotes}
        onSave={handleNotesSave}
        onClose={() => setNotesModal(null)}
      />

      {/* Add Time modal */}
      <div
        className={`fixed inset-0 bg-black/65 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-200 ${timeModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setTimeModal(null)}
      >
        <div
          className={`bg-[#1a1d27] border border-[#2a2f45] rounded-lg shadow-2xl w-80 transition-all duration-200 ${timeModal ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[#2a2f45]">
            <h3 className="text-[15px] font-semibold text-slate-200">Add Time</h3>
            <button className="text-slate-500 hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-[#21253a] transition-colors" onClick={() => setTimeModal(null)}>✕</button>
          </div>
          <div className="px-[18px] py-4 flex flex-col gap-3">
            {timeModal && timeModal.current > 0 && (
              <div className="text-[13px] text-slate-400 bg-[#21253a] rounded px-3 py-2">
                Total so far: <span className="text-slate-200 font-semibold">{formatTimeWorked(timeModal.current)}</span>
              </div>
            )}
            <div className="flex gap-3">
              <label className="flex flex-col gap-1.5 flex-1 text-[12px] font-medium text-slate-500 uppercase tracking-[0.05em]">
                Arrival
                <input
                  type="time"
                  className="px-2.5 py-2 border border-[#2a2f45] rounded text-[14px] text-slate-200 bg-[#21253a] focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                  value={timeInput.arrival}
                  onChange={(e) => setTimeInput((t) => ({ ...t, arrival: e.target.value }))}
                  autoFocus={!!timeModal}
                />
              </label>
              <label className="flex flex-col gap-1.5 flex-1 text-[12px] font-medium text-slate-500 uppercase tracking-[0.05em]">
                Departure
                <input
                  type="time"
                  className="px-2.5 py-2 border border-[#2a2f45] rounded text-[14px] text-slate-200 bg-[#21253a] focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                  value={timeInput.departure}
                  onChange={(e) => setTimeInput((t) => ({ ...t, departure: e.target.value }))}
                />
              </label>
            </div>
            {timeInput.arrival && timeInput.departure && (() => {
              const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
              const diff = toMin(timeInput.departure) - toMin(timeInput.arrival);
              return diff > 0 ? (
                <div className="text-[13px] text-slate-400 bg-[#21253a] rounded px-3 py-2">
                  Time on site: <span className="text-slate-200 font-semibold">{formatTimeWorked(diff)}</span>
                </div>
              ) : diff <= 0 ? (
                <div className="text-[13px] text-red-400">Departure must be after arrival</div>
              ) : null;
            })()}
          </div>
          <div className="flex justify-end gap-2 px-[18px] py-3 border-t border-[#2a2f45]">
            <button
              className="px-3 py-1.5 bg-[#21253a] border border-[#2a2f45] text-slate-200 hover:bg-[#2a2f45] rounded text-sm font-medium cursor-pointer transition-colors"
              onClick={() => setTimeModal(null)}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleTimeAdd}
              disabled={!timeInput.arrival || !timeInput.departure}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
