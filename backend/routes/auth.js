const express = require('express');
const router  = express.Router();
const oracledb = require('oracledb');
const { getConnection } = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required' });
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT user_id   AS "user_id",
              full_name AS "full_name",
              email     AS "email",
              phone     AS "phone",
              role      AS "role",
              status    AS "status"
       FROM users
       WHERE email = :email AND password = :password`,
      { email, password },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const user = result.rows[0];
    if (user.status === 'blocked')
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact support.' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  if (!full_name || !email || !password)
    return res.status(400).json({ success: false, message: 'Name, email, and password required' });
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  if (password.length < 6)
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  let conn;
  try {
    conn = await getConnection();
    const check = await conn.execute(
      `SELECT user_id FROM users WHERE email = :email`,
      { email }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (check.rows.length > 0)
      return res.status(409).json({ success: false, message: 'Email already registered' });
    const insert = await conn.execute(
      `INSERT INTO users (full_name, email, phone, password, role, status)
       VALUES (:full_name, :email, :phone, :password, 'customer', 'active')
       RETURNING user_id INTO :user_id`,
      { full_name, email, phone: phone || null, password, user_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }
    );
    await conn.commit();
    const userId = insert.outBinds.user_id[0];
    res.json({ success: true, user: { user_id: userId, full_name, email, phone: phone || null, role: 'customer', status: 'active' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// PUT /api/auth/profile/:userId — update profile
router.put('/profile/:userId', async (req, res) => {
  const { full_name, phone, password } = req.body;
  let conn;
  try {
    conn = await getConnection();
    if (password) {
      await conn.execute(
        `UPDATE users SET full_name = :full_name, phone = :phone, password = :password WHERE user_id = :id`,
        { full_name, phone: phone || null, password, id: parseInt(req.params.userId) }
      );
    } else {
      await conn.execute(
        `UPDATE users SET full_name = :full_name, phone = :phone WHERE user_id = :id`,
        { full_name, phone: phone || null, id: parseInt(req.params.userId) }
      );
    }
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;