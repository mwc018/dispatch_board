import express, { Request, Response } from 'express';
import db from '../db/database';

const router = express.Router();

// GET /api/service-orders
router.get('/', (req: Request, res: Response) => {
  const orders = db.prepare('SELECT * FROM service_orders ORDER BY created_at DESC').all();
  res.json(orders);
});

// POST /api/service-orders — manually create a service order
router.post('/', (req: Request, res: Response) => {
  const { zoho_id, subject, customer_name, address, description, phone } = req.body;
  if (!subject) return res.status(400).json({ error: 'subject is required' });

  try {
    const result = db.prepare(`
      INSERT INTO service_orders (zoho_id, subject, customer_name, address, description, phone, status)
      VALUES (?, ?, ?, ?, ?, ?, 'unassigned')
    `).run([zoho_id || `manual_${Date.now()}`, subject, customer_name || null, address || null, description || null, phone || null]);

    const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM unassigned_order').get();
    db.prepare('INSERT OR IGNORE INTO unassigned_order (service_order_id, position) VALUES (?, ?)')
      .run([result.lastInsertRowid, maxPos.m + 1]);

    const order = db.prepare('SELECT * FROM service_orders WHERE id = ?').get([result.lastInsertRowid]);
    req.app.get('io')?.emit('board:refresh');
    res.status(201).json(order);
  } catch (err: any) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Service order with this Zoho ID already exists' });
    }
    throw err;
  }
});

// PUT /api/service-orders/:id
router.put('/:id', (req: Request, res: Response) => {
  const { subject, customer_name, address, description, phone } = req.body;
  const order = db.prepare('SELECT * FROM service_orders WHERE id = ?').get([req.params.id]);
  if (!order) return res.status(404).json({ error: 'Not found' });

  db.prepare(`
    UPDATE service_orders SET
      subject = COALESCE(?, subject),
      customer_name = COALESCE(?, customer_name),
      address = COALESCE(?, address),
      description = COALESCE(?, description),
      phone = COALESCE(?, phone),
      updated_at = datetime('now')
    WHERE id = ?
  `).run([subject ?? null, customer_name ?? null, address ?? null, description ?? null, phone ?? null, req.params.id]);

  const updated = db.prepare('SELECT * FROM service_orders WHERE id = ?').get([req.params.id]);
  req.app.get('io')?.emit('board:refresh');
  res.json(updated);
});

// DELETE /api/service-orders/:id
router.delete('/:id', (req: Request, res: Response) => {
  const order = db.prepare('SELECT * FROM service_orders WHERE id = ?').get([req.params.id]);
  if (!order) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM service_orders WHERE id = ?').run([req.params.id]);
  req.app.get('io')?.emit('board:refresh');
  res.json({ success: true });
});

export default router;
