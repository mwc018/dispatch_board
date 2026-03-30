import { Database } from 'node-sqlite3-wasm';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', 'data', 'dispatch.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db: any = new Database(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS service_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zoho_id TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    account_name TEXT,
    customer_name TEXT,
    address TEXT,
    description TEXT,
    phone TEXT,
    status TEXT DEFAULT 'unassigned',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS technicians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zoho_user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    color TEXT DEFAULT '#3b82f6',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS dispatch_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_order_id INTEGER NOT NULL,
    technician_id INTEGER NOT NULL,
    priority INTEGER NOT NULL,
    scheduled_time TEXT,
    dispatch_date TEXT NOT NULL DEFAULT (date('now')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
    UNIQUE(service_order_id, dispatch_date)
  );

  CREATE TABLE IF NOT EXISTS unassigned_order (
    service_order_id INTEGER PRIMARY KEY,
    position INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_assignments_date ON dispatch_assignments(dispatch_date);
  CREATE INDEX IF NOT EXISTS idx_assignments_tech ON dispatch_assignments(technician_id, dispatch_date);
`);

// Migrations
try { db.exec('ALTER TABLE service_orders ADD COLUMN account_name TEXT'); } catch (_) {}

export default db;
