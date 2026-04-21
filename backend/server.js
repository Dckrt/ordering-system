// ============================================================
// backend/server.js  (replace your existing one)
// ============================================================

const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

// ── Body size limit 20MB for base64 product/profile images ──
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ── Serve frontend ───────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..')));

// ── Health check ─────────────────────────────────────────────
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!', time: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/admin',    require('./routes/admin'));

// ── OTP email verification (NEW) ─────────────────────────────
app.use('/api/otp', require('./routes/otp'));

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📧 Gmail user: ${process.env.GMAIL_USER || '⚠️  Not set in .env'}`);
});