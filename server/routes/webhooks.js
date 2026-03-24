const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.post('/zoho', (req, res) => {
  try {
    const payload = req.body;
    const records = Array.isArray(payload) ? payload : payload.data || [payload];

    let created = 0;
    let updated = 0;

    for (const record of records) {
      const zohoId = record.id || record.ID;
      if (!zohoId) continue;

      const subject = record.Subject || record.Name || record.subject || 'Untitled Service Order';
      const customerName =
        record.Contact_Name?.name || record.Account_Name?.name || record.Customer_Name || record.contact_name || null;
      const addressParts = [record.Billing_Street, record.Billing_City, record.Billing_State, record.Billing_Code].filter(Boolean);
      const address = record.Address || (addressParts.length ? addressParts.join(' ') : null) || record.Service_Address || record.Mailing_Street || null;
      const description = record.Description || record.description || null;
      const phone = record.Phone || record.Mobile || record.phone || null;

      const existing = db.prepare('SELECT id FROM service_orders WHERE zoho_id = ?').get([String(zohoId)]);

      if (existing) {
        db.prepare(`
          UPDATE service_orders
          SET subject = ?, customer_name = ?, address = ?, description = ?, phone = ?, updated_at = datetime('now')
          WHERE zoho_id = ?
        `).run([subject, customerName, address, description, phone, String(zohoId)]);
        updated++;
      } else {
        const result = db.prepare(`
          INSERT INTO service_orders (zoho_id, subject, customer_name, address, description, phone, status)
          VALUES (?, ?, ?, ?, ?, ?, 'unassigned')
        `).run([String(zohoId), subject, customerName, address, description, phone]);

        const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM unassigned_order').get();
        db.prepare('INSERT OR IGNORE INTO unassigned_order (service_order_id, position) VALUES (?, ?)')
          .run([result.lastInsertRowid, maxPos.m + 1]);
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

module.exports = router;
