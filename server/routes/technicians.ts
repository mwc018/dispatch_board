import express, { Request, Response } from 'express';
import db from '../db/database';
import { fetchCRMUsers } from '../services/zoho';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const techs = db.prepare('SELECT * FROM technicians ORDER BY name ASC').all();
  res.json(techs);
});

router.post('/', (req: Request, res: Response) => {
  const { zoho_user_id, name, email, color } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const result = db.prepare(`
      INSERT INTO technicians (zoho_user_id, name, email, color)
      VALUES (?, ?, ?, ?)
    `).run([zoho_user_id || `manual_${Date.now()}`, name, email || null, color || '#3b82f6']);

    const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get([result.lastInsertRowid]);
    req.app.get('io')?.emit('board:refresh');
    res.status(201).json(tech);
  } catch (err: any) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Technician already exists' });
    }
    throw err;
  }
});

router.put('/:id', (req: Request, res: Response) => {
  const { name, email, color, is_active } = req.body;
  const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get([req.params.id]);
  if (!tech) return res.status(404).json({ error: 'Not found' });

  db.prepare(`
    UPDATE technicians SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      color = COALESCE(?, color),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run([name ?? null, email ?? null, color ?? null, is_active ?? null, req.params.id]);

  const updated = db.prepare('SELECT * FROM technicians WHERE id = ?').get([req.params.id]);
  req.app.get('io')?.emit('board:refresh');
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get([req.params.id]);
  if (!tech) return res.status(404).json({ error: 'Not found' });

  const assignments = db.prepare('SELECT service_order_id FROM dispatch_assignments WHERE technician_id = ?').all([req.params.id]);
  for (const a of assignments) {
    const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM unassigned_order').get();
    db.prepare('INSERT OR IGNORE INTO unassigned_order (service_order_id, position) VALUES (?, ?)').run([a.service_order_id, maxPos.m + 1]);
    db.prepare("UPDATE service_orders SET status = 'unassigned' WHERE id = ?").run([a.service_order_id]);
  }
  db.prepare('DELETE FROM technicians WHERE id = ?').run([req.params.id]);

  req.app.get('io')?.emit('board:refresh');
  res.json({ success: true });
});

router.post('/sync-zoho', async (req: Request, res: Response) => {
  try {
    const users = await fetchCRMUsers();
    let added = 0;
    for (const user of users) {
      const existing = db.prepare('SELECT id FROM technicians WHERE zoho_user_id = ?').get([user.id]);
      if (!existing) {
        db.prepare('INSERT OR IGNORE INTO technicians (zoho_user_id, name, email) VALUES (?, ?, ?)')
          .run([user.id, user.full_name || user.name, user.email]);
        added++;
      }
    }
    req.app.get('io')?.emit('board:refresh');
    res.json({ success: true, added, total: users.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Resolve role for a logged-in user by email
router.get('/me', (req: Request, res: Response) => {
  const email = (req.query.email as string || '').toLowerCase().trim();
  if (!email) return res.status(400).json({ error: 'email is required' });

  const managerEmails = (process.env.MANAGER_EMAILS || '')
    .split(',')
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);

  if (managerEmails.includes(email)) {
    return res.json({ role: 'manager' });
  }

  const tech = db.prepare('SELECT * FROM technicians WHERE lower(email) = ?').get([email]) as any;
  if (tech) {
    return res.json({ role: 'tech', techId: tech.id, name: tech.name });
  }

  return res.json({ role: 'denied' });
});

export default router;
