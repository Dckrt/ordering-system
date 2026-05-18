// ============================================================
// backend/server.js — FIXED for LAN/Hotspot/Phone access
// ============================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ✅ Allow ALL origins — phone, PC, any device on the network
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ✅ Serve frontend static files
app.use(express.static(path.join(__dirname, '..')));

// ✅ Health check
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!', time: new Date().toISOString() });
});

// ✅ Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/otp',      require('./routes/otp'));
app.use('/api/contact',  require('./routes/contact'));

// ✅ Root redirect to frontend
app.get('/', (req, res) => {
  res.redirect('/frontend/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server running!`);
  console.log(`💻 PC:    http://localhost:${PORT}/frontend/index.html`);
  console.log(`📱 Phone: http://172.20.10.3:${PORT}/frontend/index.html`);
  console.log(`🔌 API:   http://172.20.10.3:${PORT}/api/test`);
  console.log(`📧 Gmail: ${process.env.GMAIL_USER || '⚠️  GMAIL_USER not set'}`);
  console.log(`🔑 Pass:  ${process.env.GMAIL_PASS ? '✅ Set' : '⚠️  Not set'}\n`);
});