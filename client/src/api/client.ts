import axios from 'axios';
import { BoardState, TechBoardState, Technician, ServiceOrder, AddTechData, AddOrderData } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const getBoard = (date: string): Promise<BoardState> =>
  api.get('/board', { params: { date } }).then((r) => r.data);

export const getTechBoard = (techId: string | number, date: string): Promise<TechBoardState> =>
  api.get(`/board/tech/${techId}`, { params: { date } }).then((r) => r.data);

export const assignOrder = (payload: {
  service_order_id: number;
  technician_id: number;
  date: string;
  priority?: number;
  scheduled_time?: string | null;
  notes?: string | null;
}): Promise<BoardState> =>
  api.post('/dispatch/assign', payload).then((r) => r.data);

export const unassignOrder = (service_order_id: number, date: string): Promise<BoardState> =>
  api.post('/dispatch/unassign', { service_order_id, date }).then((r) => r.data);

export const reorderUnassigned = (ordered_ids: number[], date: string): Promise<BoardState> =>
  api.post('/dispatch/reorder-unassigned', { ordered_ids, date }).then((r) => r.data);

export const reorderTech = (technician_id: number, date: string, ordered_assignment_ids: number[]): Promise<BoardState> =>
  api.post('/dispatch/reorder-tech', { technician_id, date, ordered_assignment_ids }).then((r) => r.data);

export const setTime = (assignment_id: number, scheduled_time: string | null, date: string): Promise<BoardState> =>
  api.post('/dispatch/set-time', { assignment_id, scheduled_time, date }).then((r) => r.data);

export const setNotes = (assignment_id: number, notes: string | null, date: string): Promise<BoardState> =>
  api.post('/dispatch/set-notes', { assignment_id, notes, date }).then((r) => r.data);

export const getTechnicians = (): Promise<Technician[]> =>
  api.get('/technicians').then((r) => r.data);

export const addTechnician = (data: AddTechData): Promise<Technician> =>
  api.post('/technicians', data).then((r) => r.data);

export const updateTechnician = (id: number, data: Partial<AddTechData>): Promise<Technician> =>
  api.put(`/technicians/${id}`, data).then((r) => r.data);

export const deleteTechnician = (id: number): Promise<{ success: boolean }> =>
  api.delete(`/technicians/${id}`).then((r) => r.data);

export const syncZohoTechs = (): Promise<{ success: boolean; added: number; total: number }> =>
  api.post('/technicians/sync-zoho').then((r) => r.data);

export const addServiceOrder = (data: AddOrderData): Promise<ServiceOrder> =>
  api.post('/service-orders', data).then((r) => r.data);

export const deleteServiceOrder = (id: number): Promise<{ success: boolean }> =>
  api.delete(`/service-orders/${id}`).then((r) => r.data);

export default api;
