// ============================================================
// backend/routes/contact.js
// Save this file to: backend/routes/contact.js
// ============================================================

const express  = require('express');
const router   = express.Router();
const oracledb = require('oracledb');
const { getConnection } = require('../db');

// ── Helper: read CLOB ────────────────────────────────────────
async function readClob(clob) {
  if (!clob) return '';
  if (typeof clob === 'string') return clob;
  return new Promise((resolve, reject) => {
    let data = '';
    clob.setEncoding('utf8');
    clob.on('data',  chunk => data += chunk);
    clob.on('end',   ()    => resolve(data));
    clob.on('error', err   => reject(err));
  });
}

// ── POST /api/contact ─────────────────────────────────────────
router.post('/', async (req, res) => {
  const { full_name, phone, email, subject, message } = req.body;
  if (!full_name || !email || !subject || !message)
    return res.status(400).json({ success: false, message: 'All fields are required.' });

  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `INSERT INTO contact_messages (id, full_name, phone, email, subject, message, is_read)
       VALUES (contact_messages_seq.NEXTVAL, :full_name, :phone, :email, :subject, :message, 0)`,
      { full_name, phone: phone || null, email, subject, message }
    );
    await conn.commit();
    console.log(`✅ New contact message from: ${email}`);
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Contact error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally { if (conn) await conn.close(); }
});

// ── GET /api/contact ─────────────────────────────────────────
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT id                                              AS "id",
              full_name                                      AS "full_name",
              phone                                          AS "phone",
              email                                          AS "email",
              subject                                        AS "subject",
              message                                        AS "message",
              is_read                                        AS "is_read",
              TO_CHAR(created_at,'YYYY-MM-DD"T"HH24:MI:SS') AS "created_at"
       FROM contact_messages
       ORDER BY created_at DESC`,
      {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const rows = await Promise.all(result.rows.map(async row => ({
      ...row,
      message: await readClob(row.message)
    })));
    res.json(rows);
  } catch (err) {
    console.error('Get messages error:', err.message);
    res.status(500).json({ error: err.message });
  } finally { if (conn) await conn.close(); }
});

// ── PUT /api/contact/:id/read ─────────────────────────────────
router.put('/:id/read', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE contact_messages SET is_read = 1 WHERE id = :id`,
      { id: parseInt(req.params.id) }
    );
    await conn.commit();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  finally { if (conn) await conn.close(); }
});

// ── DELETE /api/contact/:id ───────────────────────────────────
router.delete('/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `DELETE FROM contact_messages WHERE id = :id`,
      { id: parseInt(req.params.id) }
    );
    await conn.commit();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  finally { if (conn) await conn.close(); }
});

module.exports = router;