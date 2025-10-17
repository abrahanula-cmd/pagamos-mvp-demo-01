const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('better-sqlite3');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a la base de datos SQLite
const db = new Database(path.join(__dirname, 'db', 'pagamos.db'));

// Crear tabla de vales si no existe
db.prepare(`
  CREATE TABLE IF NOT EXISTS vouchers (
    id TEXT PRIMARY KEY,
    amount REAL,
    currency TEXT,
    beneficiary TEXT,
    category TEXT,
    expires_at TEXT,
    status TEXT,
    created_at TEXT,
    redeemed_at TEXT,
    invoice_number TEXT
  )
`).run();

// Archivos estáticos (HTMLs en /public)
app.use(express.static(path.join(__dirname, 'public')));

// Página inicial
app.get('/', (req, res) => {
  res.send(`
    <h1>Págamos MVP</h1>
    <ul>
      <li><a href="/new.html">Generar vale (admin)</a></li>
      <li><a href="/verify.html">Verificar vale</a></li>
      <li><a href="/redeem.html">Canjear vale (comercio)</a></li>
    </ul>
    <p>Este demo es solo para fines de demostración.</p>
  `);
});

// API: generar vale
app.post('/api/voucher', (req, res) => {
  const { amount, beneficiary, category, days, invoice_number } = req.body;
  const id = `PGM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const created_at = new Date().toISOString();
  const expires_at = new Date(Date.now() + (days || 30) * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO vouchers (id, amount, currency, beneficiary, category, expires_at, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, amount, 'USD', beneficiary, category, expires_at, 'valid', created_at);

  res.json({
    id,
    amount,
    currency: 'USD',
    beneficiary,
    category,
    expires_at,
    status: 'valid',
    created_at
  });
});

// API: verificar vale
app.get('/api/voucher/:id', (req, res) => {
  const { id } = req.params;
  const voucher = db.prepare(`SELECT * FROM vouchers WHERE id = ?`).get(id);

  if (!voucher) {
    return res.status(404).json({ error: 'Vale no encontrado' });
  }
  res.json(voucher);
});

// API: canjear vale
app.post('/api/voucher/:id/redeem', (req, res) => {
  const { id } = req.params;
  const { invoice_number } = req.body;
  const voucher = db.prepare(`SELECT * FROM vouchers WHERE id = ?`).get(id);

  if (!voucher) {
    return res.status(404).json({ error: 'Vale no encontrado' });
  }
  if (voucher.status === 'redeemed') {
    return res.status(400).json({ error: 'Vale ya fue canjeado' });
  }

  const redeemed_at = new Date().toISOString();
  db.prepare(`
    UPDATE vouchers
    SET status = ?, redeemed_at = ?, invoice_number = ?
    WHERE id = ?
  `).run('redeemed', redeemed_at, invoice_number, id);

  res.json({
    ...voucher,
    status: 'redeemed',
    redeemed_at,
    invoice_number
  });
});

// Puerto dinámico para nube (o 3000 en local)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Págamos MVP listening on ${PORT}`);
});
