import express, { Request, Response } from 'express';
import db from '../db/database';

const router = express.Router();

interface WebhookLogEntry {
  timestamp: string;
  total: number;
  created: number;
  updated: number;
  skipped: { zohoId: string | null; reason: string }[];
  errors: { zohoId: string | null; error: string }[];
  raw: any;
}

let lastLog: WebhookLogEntry | null = null;

router.get('/log', (_req: Request, res: Response) => {
  res.json(lastLog || { message: 'No webhook received yet' });
});

router.post('/zoho', (req: Request, res: Response) => {
  const payload = req.body;
  const records: any[] = Array.isArray(payload) ? payload : payload.data || [payload];

  const log: WebhookLogEntry = {
    timestamp: new Date().toISOString(),
    total: records.length,
    created: 0,
    updated: 0,
    skipped: [],
    errors: [],
    raw: payload,
  };

  for (const record of records) {
    const zohoId = record.id || record.ID || null;

    if (!zohoId) {
      log.skipped.push({ zohoId: null, reason: 'missing zoho id' });
      continue;
    }

    try {
      const subject = record.Subject || record.subject || 'Untitled Service Order';
      const soNumber = record.serviceorder_number || record.historical_serviceorder_number || null;
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

      const existing = db.prepare('SELECT id, status FROM service_orders WHERE zoho_id = ?').get([String(zohoId)]) as any;

      if (existing) {
        const newStatus = isClosed ? 'completed' : existing.status;
        db.prepare(
          `UPDATE service_orders SET so_number = ?, subject = ?, account_name = ?, customer_name = ?, address = ?, description = ?, phone = ?, status = ?, updated_at = datetime('now') WHERE zoho_id = ?`
        ).run([soNumber, subject, accountName, customerName, address, description, phone, newStatus, String(zohoId)]);

        if (isClosed) {
          db.prepare(`UPDATE dispatch_assignments SET is_completed = 1, updated_at = datetime('now') WHERE service_order_id = ?`)
            .run([existing.id]);
          db.prepare('DELETE FROM unassigned_order WHERE service_order_id = ?').run([existing.id]);
        }
        log.updated++;
      } else if (isClosed) {
        log.skipped.push({ zohoId: String(zohoId), reason: `status is Closed — not added` });
      } else {
        const result = db.prepare(
          `INSERT INTO service_orders (zoho_id, so_number, subject, account_name, customer_name, address, description, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unassigned')`
        ).run([String(zohoId), soNumber, subject, accountName, customerName, address, description, phone]);
        db.prepare('UPDATE unassigned_order SET position = position + 1').run();
        db.prepare('INSERT OR IGNORE INTO unassigned_order (service_order_id, position) VALUES (?, 0)').run([result.lastInsertRowid]);
        log.created++;
      }
    } catch (err: any) {
      log.errors.push({ zohoId: zohoId ? String(zohoId) : null, error: err.message });
      console.error(`[Webhook] Error processing record ${zohoId}:`, err.message);
    }
  }

  lastLog = log;
  req.app.get('io')?.emit('board:refresh');
  res.json({ success: true, created: log.created, updated: log.updated, skipped: log.skipped.length, errors: log.errors.length });
});

export default router;
