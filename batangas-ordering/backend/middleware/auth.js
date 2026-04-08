const express = require('express');
const router = express.Router();
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
      `SELECT user_id, full_name, email, phone, role
       FROM users
       WHERE email = :email AND password = :password`,
      { email, password },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = result.rows[0];
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

  let conn;
  try {
    conn = await getConnection();

    // Check if email already exists
    const check = await conn.execute(
      `SELECT user_id FROM users WHERE email = :email`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (check.rows.length > 0)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    // Insert new user
    const insert = await conn.execute(
      `INSERT INTO users (full_name, email, phone, password, role)
       VALUES (:full_name, :email, :phone, :password, 'customer')
       RETURNING user_id INTO :user_id`,
      {
        full_name,
        email,
        phone: phone || null,
        password,
        user_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    await conn.commit();

    const userId = insert.outBinds.user_id[0];
    res.json({
      success: true,
      user: { user_id: userId, full_name, email, phone, role: 'customer' }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;