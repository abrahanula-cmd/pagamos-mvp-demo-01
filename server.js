
// server.js — Págamos MVP (Render-friendly, con creación automática de carpeta DB)

/*
  Cambios clave vs tu versión original:
  1) Crea la carpeta de la base de datos si no existe (evita "Cannot open database because the directory does not exist").
  2) Permite configurar la ruta con la variable de entorno DB_DIR (opcional).
  3) Cierra la DB de forma limpia al recibir señales de apagado en Render.
*/

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ====== CONFIG DB (carpeta segura) ======
const DB_DIR = process.env.DB_DIR || path.join(__dirname, 'db');
const DB_FILE = process.env.DB_FILE || 'pagamos.db';
const DB_PATH = path.join(DB_DIR, DB_FILE);

// Asegurar carpeta
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Conexión a la base de datos SQLite
const db = new Database(DB_PATH);

// Opcional: pragmas útiles
try {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (e) {
  console.warn('No se pudieron aplicar PRAGMAs SQLite:', e.message);
}

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

// Healthcheck (útil para Render)
app.get('/healthz', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.status(200).send('ok');
  } catch {
    res.status(500).send('db error');
  }
});

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
  const { amount, beneficiary, category, days, invoice_number } = req.body || {};
  if (amount == null || !beneficiary) {
    return res.status(400).json({ error: 'amount y beneficiary son requeridos' });
  }

  const id = `PGM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const created_at = new Date().toISOString();
  const expires_at = new Date(Date.now() + (days || 30) * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO vouchers (id, amount, currency, beneficiary, category, expires_at, status, created_at, invoice_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, amount, 'USD', beneficiary, category || null, expires_at, 'valid', created_at, invoice_number || null);

  res.json({
    id,
    amount,
    currency: 'USD',
    beneficiary,
    category: category || null,
    expires_at,
    status: 'valid',
    created_at,
    invoice_number: invoice_number || null
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
  const { invoice_number } = req.body || {};
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
    SET status = ?, redeemed_at = ?, invoice_number = COALESCE(?, invoice_number)
    WHERE id = ?
  `).run('redeemed', redeemed_at, invoice_number || null, id);

  const updated = db.prepare(`SELECT * FROM vouchers WHERE id = ?`).get(id);
  res.json(updated);
});

// Puerto dinámico para nube (o 3000 en local)
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Págamos MVP listening on ${PORT} — DB en ${DB_PATH}`);
});

// Apagado limpio (Render la envía en despliegues/rollouts)
const shutdown = (sig) => {
  console.log(`Recibida señal ${sig}, cerrando servidor...`);
  try { db.close(); } catch (e) { console.warn('Error al cerrar DB:', e.message); }
  server.close(() => {
    console.log('Servidor cerrado.');
    process.exit(0);
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
