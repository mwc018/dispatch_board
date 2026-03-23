const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { updateServiceOrderAssignment } = require('../services/zoho');

function getBoardState(date) {
  const today = date || new Date().toISOString().split('T')[0];

  const unassigned = db.prepare(`
    SELECT so.*, uo.position
    FROM service_orders so
    JOIN unassigned_order uo ON uo.service_order_id = so.id
    ORDER BY uo.position ASC
  `).all();

  const technicians = db.prepare('SELECT * FROM technicians WHERE is_active = 1 ORDER BY name ASC').all();

  for (const tech of technicians) {
    tech.assignments = db.prepare(`
      SELECT da.*, so.zoho_id, so.subject, so.customer_name, so.address, so.description, so.phone, so.status
      FROM dispatch_assignments da
      JOIN service_orders so ON so.id = da.service_order_id
      WHERE da.technician_id = ? AND da.dispatch_date = ?
      ORDER BY da.priority ASC
    `).all([tech.id, today]);
  }

  return { date: today, unassigned, technicians };
}

router.get('/board', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  res.json(getBoardState(date));
});

router.get('/board/tech/:techId', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get([req.params.techId]);
  if (!tech) return res.status(404).json({ error: 'Technician not found' });

  const assignments = db.prepare(`
    SELECT da.*, so.zoho_id, so.subject, so.customer_name, so.address, so.description, so.phone
    FROM dispatch_assignments da
    JOIN service_orders so ON so.id = da.service_order_id
    WHERE da.technician_id = ? AND da.dispatch_date = ?
    ORDER BY da.priority ASC
  `).all([req.params.techId, date]);

  res.json({ tech, date, assignments });
});

router.post('/assign', (req, res) => {
  const { service_order_id, technician_id, priority, scheduled_time, date, notes } = req.body;
  if (!service_order_id || !technician_id) {
    return res.status(400).json({ error: 'service_order_id and technician_id are required' });
  }

  const dispatchDate = date || new Date().toISOString().split('T')[0];
  const order = db.prepare('SELECT * FROM service_orders WHERE id = ?').get([service_order_id]);
  const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get([technician_id]);
  if (!order || !tech) return res.status(404).json({ error: 'Order or technician not found' });

  let assignPriority = priority;
  if (!assignPriority) {
    const maxP = db.prepare(
      'SELECT COALESCE(MAX(priority), 0) as m FROM dispatch_assignments WHERE technician_id = ? AND dispatch_date = ?'
    ).get([technician_id, dispatchDate]);
    assignPriority = maxP.m + 1;
  } else {
    db.prepare(`
      UPDATE dispatch_assignments SET priority = priority + 1
      WHERE technician_id = ? AND dispatch_date = ? AND priority >= ?
    `).run([technician_id, dispatchDate, assignPriority]);
  }

  db.prepare('DELETE FROM unassigned_order WHERE service_order_id = ?').run([service_order_id]);
  db.prepare('DELETE FROM dispatch_assignments WHERE service_order_id = ? AND dispatch_date = ?').run([service_order_id, dispatchDate]);

  db.prepare(`
    INSERT INTO dispatch_assignments (service_order_id, technician_id, priority, scheduled_time, dispatch_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run([service_order_id, technician_id, assignPriority, scheduled_time || null, dispatchDate, notes || null]);

  db.prepare("UPDATE service_orders SET status = 'assigned', updated_at = datetime('now') WHERE id = ?").run([service_order_id]);

  repackUnassigned();

  updateServiceOrderAssignment({
    zohoId: order.zoho_id,
    techName: tech.name,
    priority: assignPriority,
    scheduledTime: scheduled_time || null,
    status: 'Assigned',
  });

  const board = getBoardState(dispatchDate);
  req.app.get('io')?.emit('board:updated', board);
  res.json(board);
});

router.post('/unassign', (req, res) => {
  const { service_order_id, date } = req.body;
  if (!service_order_id) return res.status(400).json({ error: 'service_order_id is required' });

  const dispatchDate = date || new Date().toISOString().split('T')[0];
  const order = db.prepare('SELECT * FROM service_orders WHERE id = ?').get([service_order_id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare('DELETE FROM dispatch_assignments WHERE service_order_id = ? AND dispatch_date = ?').run([service_order_id, dispatchDate]);
  db.prepare("UPDATE service_orders SET status = 'unassigned', updated_at = datetime('now') WHERE id = ?").run([service_order_id]);

  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM unassigned_order').get();
  db.prepare('INSERT OR IGNORE INTO unassigned_order (service_order_id, position) VALUES (?, ?)').run([service_order_id, maxPos.m + 1]);

  updateServiceOrderAssignment({
    zohoId: order.zoho_id,
    techName: null,
    priority: null,
    scheduledTime: null,
    status: 'Unassigned',
  });

  const board = getBoardState(dispatchDate);
  req.app.get('io')?.emit('board:updated', board);
  res.json(board);
});

router.post('/reorder-unassigned', (req, res) => {
  const { ordered_ids } = req.body;
  if (!Array.isArray(ordered_ids)) return res.status(400).json({ error: 'ordered_ids must be an array' });

  const update = db.prepare('UPDATE unassigned_order SET position = ? WHERE service_order_id = ?');
  db.exec('BEGIN');
  try {
    ordered_ids.forEach((id, index) => update.run([index, id]));
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  const board = getBoardState(req.body.date);
  req.app.get('io')?.emit('board:updated', board);
  res.json(board);
});

router.post('/reorder-tech', (req, res) => {
  const { technician_id, date, ordered_assignment_ids } = req.body;
  if (!technician_id || !Array.isArray(ordered_assignment_ids)) {
    return res.status(400).json({ error: 'technician_id and ordered_assignment_ids are required' });
  }

  const dispatchDate = date || new Date().toISOString().split('T')[0];
  const update = db.prepare("UPDATE dispatch_assignments SET priority = ?, updated_at = datetime('now') WHERE id = ?");
  db.exec('BEGIN');
  try {
    ordered_assignment_ids.forEach((id, index) => update.run([index + 1, id]));
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  for (let i = 0; i < ordered_assignment_ids.length; i++) {
    const a = db.prepare('SELECT da.*, so.zoho_id FROM dispatch_assignments da JOIN service_orders so ON so.id = da.service_order_id WHERE da.id = ?').get([ordered_assignment_ids[i]]);
    if (a) updateServiceOrderAssignment({ zohoId: a.zoho_id, priority: i + 1, scheduledTime: a.scheduled_time, status: 'Assigned' });
  }

  const board = getBoardState(dispatchDate);
  req.app.get('io')?.emit('board:updated', board);
  res.json(board);
});

router.post('/set-time', (req, res) => {
  const { assignment_id, scheduled_time, date } = req.body;
  if (!assignment_id) return res.status(400).json({ error: 'assignment_id is required' });

  const assignment = db.prepare('SELECT da.*, so.zoho_id FROM dispatch_assignments da JOIN service_orders so ON so.id = da.service_order_id WHERE da.id = ?').get([assignment_id]);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  db.prepare("UPDATE dispatch_assignments SET scheduled_time = ?, updated_at = datetime('now') WHERE id = ?")
    .run([scheduled_time || null, assignment_id]);

  updateServiceOrderAssignment({ zohoId: assignment.zoho_id, scheduledTime: scheduled_time || null, status: 'Assigned' });

  const board = getBoardState(date || assignment.dispatch_date);
  req.app.get('io')?.emit('board:updated', board);
  res.json(board);
});

router.post('/set-notes', (req, res) => {
  const { assignment_id, notes, date } = req.body;
  if (!assignment_id) return res.status(400).json({ error: 'assignment_id is required' });

  const assignment = db.prepare('SELECT * FROM dispatch_assignments WHERE id = ?').get([assignment_id]);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  db.prepare("UPDATE dispatch_assignments SET notes = ?, updated_at = datetime('now') WHERE id = ?")
    .run([notes || null, assignment_id]);

  const board = getBoardState(date || assignment.dispatch_date);
  req.app.get('io')?.emit('board:updated', board);
  res.json(board);
});

function repackUnassigned() {
  const rows = db.prepare('SELECT service_order_id FROM unassigned_order ORDER BY position ASC').all();
  const update = db.prepare('UPDATE unassigned_order SET position = ? WHERE service_order_id = ?');
  db.exec('BEGIN');
  try {
    rows.forEach((row, i) => update.run([i, row.service_order_id]));
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

module.exports = router;
