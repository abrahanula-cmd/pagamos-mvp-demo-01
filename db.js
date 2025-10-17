const Database = require('better-sqlite3');
const db = new Database('pagamos.db');

db.exec(`
CREATE TABLE IF NOT EXISTS vouchers (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  beneficiary TEXT,
  category TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid',  -- valid|redeemed|expired
  created_at TEXT NOT NULL,
  redeemed_at TEXT,
  invoice_number TEXT
);
`);

module.exports = db;