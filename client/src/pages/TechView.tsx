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
    <div className="tech-view">
      <div className="tech-view__header">
        <h1 className="tech-view__title">
          {data?.tech ? `${data.tech.name}'s Jobs` : 'Tech View'}
        </h1>
        <div className="tech-view__controls">
          {!techId && (
            <select
              className="tech-view__select"
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
            className="tech-view__date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {!selectedTechId && (
        <div className="tech-view__prompt">Select a technician to view their assignments.</div>
      )}

      {selectedTechId && loading && (
        <div className="tech-view__loading">Loading assignments...</div>
      )}

      {error && <div className="tech-view__error">{error}</div>}

      {data && !loading && (
        <div className="tech-view__list">
          {data.assignments.length === 0 ? (
            <div className="tech-view__empty">No jobs assigned for {date}.</div>
          ) : (
            data.assignments.map((a, i) => (
              <div key={a.id} className="job-card">
                <div className="job-card__priority">#{a.priority || i + 1}</div>
                <div className="job-card__body">
                  <div className="job-card__header">
                    {a.scheduled_time && (
                      <span className="job-card__time">{formatTime(a.scheduled_time)}</span>
                    )}
                    <span className="job-card__subject">{a.subject}</span>
                  </div>
                  {a.customer_name && (
                    <div className="job-card__customer">{a.customer_name}</div>
                  )}
                  {a.address && (
                    <div className="job-card__address">
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(a.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="job-card__map-link"
                      >
                        {a.address}
                      </a>
                    </div>
                  )}
                  {a.phone && <div className="job-card__phone">{a.phone}</div>}
                  {a.description && <div className="job-card__description">{a.description}</div>}
                  {a.notes && <div className="job-card__notes">📝 {a.notes}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
