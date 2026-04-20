import express, { Request, Response } from 'express';
import db from '../db/database';

const router = express.Router();

router.post('/zoho', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const records: any[] = Array.isArray(payload) ? payload : payload.data || [payload];
    let created = 0;
    let updated = 0;

    for (const record of records) {
      const zohoId = record.id || record.ID;
      if (!zohoId) continue;

      const subject = record.Subject || record.subject || 'Untitled Service Order';
      const accountName = record.account_name || record.Account_Name?.name || null;
      const firstName = record.contact_name_first || '';
      const lastName = record.contact_name_last || '';
      const customerName = [firstName, lastName].filter(Boolean).join(' ') || null;
      const addressParts = [record.billing_street, record.billing_city, record.billing_state, record.billing_code].filter(Boolean);
      const address = addressParts.length ? addressParts.join(', ') : null;
      const description = record.description || record.Description || null;
      const phone = record.phone || record.Phone || record.Mobile || null;

      const status = record.Status || record.status || null;
      const isClosed = status === 'Closed';

      const existing = db.prepare('SELECT id FROM service_orders WHERE zoho_id = ?').get([String(zohoId)]) as any;

      if (existing) {
        const newStatus = isClosed ? 'completed' : existing.status;
        db.prepare(
          `UPDATE service_orders SET subject = ?, account_name = ?, customer_name = ?, address = ?, description = ?, phone = ?, status = ?, updated_at = datetime('now') WHERE zoho_id = ?`
        ).run([subject, accountName, customerName, address, description, phone, newStatus, String(zohoId)]);

        if (isClosed) {
          db.prepare(`UPDATE dispatch_assignments SET is_completed = 1, updated_at = datetime('now') WHERE service_order_id = ?`)
            .run([existing.id]);
          db.prepare('DELETE FROM unassigned_order WHERE service_order_id = ?').run([existing.id]);
        }
        updated++;
      } else if (!isClosed) {
        const result = db.prepare(
          `INSERT INTO service_orders (zoho_id, subject, account_name, customer_name, address, description, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'unassigned')`
        ).run([String(zohoId), subject, accountName, customerName, address, description, phone]);
        const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM unassigned_order').get() as any;
        db.prepare('INSERT OR IGNORE INTO unassigned_order (service_order_id, position) VALUES (?, ?)').run([result.lastInsertRowid, maxPos.m + 1]);
        created++;
      }
    }

    req.app.get('io')?.emit('board:refresh');
    res.json({ success: true, created, updated });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
