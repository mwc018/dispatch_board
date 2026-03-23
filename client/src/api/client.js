import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const getBoard = (date) =>
  api.get('/board', { params: { date } }).then((r) => r.data);

export const getTechBoard = (techId, date) =>
  api.get(`/board/tech/${techId}`, { params: { date } }).then((r) => r.data);

export const assignOrder = (payload) =>
  api.post('/dispatch/assign', payload).then((r) => r.data);

export const unassignOrder = (service_order_id, date) =>
  api.post('/dispatch/unassign', { service_order_id, date }).then((r) => r.data);

export const reorderUnassigned = (ordered_ids, date) =>
  api.post('/dispatch/reorder-unassigned', { ordered_ids, date }).then((r) => r.data);

export const reorderTech = (technician_id, date, ordered_assignment_ids) =>
  api.post('/dispatch/reorder-tech', { technician_id, date, ordered_assignment_ids }).then((r) => r.data);

export const setTime = (assignment_id, scheduled_time, date) =>
  api.post('/dispatch/set-time', { assignment_id, scheduled_time, date }).then((r) => r.data);

export const setNotes = (assignment_id, notes, date) =>
  api.post('/dispatch/set-notes', { assignment_id, notes, date }).then((r) => r.data);

export const getTechnicians = () =>
  api.get('/technicians').then((r) => r.data);

export const addTechnician = (data) =>
  api.post('/technicians', data).then((r) => r.data);

export const updateTechnician = (id, data) =>
  api.put(`/technicians/${id}`, data).then((r) => r.data);

export const deleteTechnician = (id) =>
  api.delete(`/technicians/${id}`).then((r) => r.data);

export const syncZohoTechs = () =>
  api.post('/technicians/sync-zoho').then((r) => r.data);

export const addServiceOrder = (data) =>
  api.post('/service-orders', data).then((r) => r.data);

export const deleteServiceOrder = (id) =>
  api.delete(`/service-orders/${id}`).then((r) => r.data);

export default api;
