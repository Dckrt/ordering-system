const express = require('express');
const router  = express.Router();
const oracledb = require('oracledb');
const { getConnection } = require('../db');

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const [orders, customers, products] = await Promise.all([
      conn.execute(`SELECT COUNT(*) AS "total", NVL(SUM(total),0) AS "revenue" FROM orders`, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
      conn.execute(`SELECT COUNT(*) AS "total" FROM users WHERE LOWER(role) != 'admin'`, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
      conn.execute(`SELECT COUNT(*) AS "total" FROM products`, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
    ]);
    res.json({
      total_orders:    orders.rows[0].total    || 0,
      total_revenue:   orders.rows[0].revenue  || 0,
      total_customers: customers.rows[0].total || 0,
      total_products:  products.rows[0].total  || 0,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (conn) await conn.close(); }
});

// GET /api/admin/customers — show ALL non-admin users
router.get('/customers', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT user_id                              AS "user_id",
              full_name                            AS "full_name",
              email                                AS "email",
              phone                                AS "phone",
              role                                 AS "role",
              NVL(status,'active')                 AS "status",
              TO_CHAR(created_at,'YYYY-MM-DD"T"HH24:MI:SS') AS "created_at"
       FROM users
       WHERE LOWER(role) != 'admin'
       ORDER BY created_at DESC`,
      {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getCustomers error:', err.message);
    res.status(500).json({ error: err.message });
  }
  finally { if (conn) await conn.close(); }
});

// PUT /api/admin/customers/:id/status — block or unblock
router.put('/customers/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['active', 'blocked'].includes(status))
    return res.status(400).json({ success: false, message: 'Invalid status' });
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE users SET status = :status WHERE user_id = :id`,
      { status, id: parseInt(req.params.id) }
    );
    await conn.commit();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  finally { if (conn) await conn.close(); }
});

// GET /api/admin/categories
router.get('/categories', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT category_id AS "category_id",
              name        AS "name",
              description AS "description"
       FROM categories ORDER BY category_id`,
      {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (conn) await conn.close(); }
});

// POST /api/admin/categories
router.post('/categories', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name required' });
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO categories (name, description) VALUES (:name, :description) RETURNING category_id INTO :category_id`,
      { name, description: description || null, category_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }
    );
    await conn.commit();
    res.json({ success: true, category_id: result.outBinds.category_id[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  finally { if (conn) await conn.close(); }
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', async (req, res) => {
  const { name, description } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE categories SET name=:name, description=:description WHERE category_id=:id`,
      { name, description: description || null, id: parseInt(req.params.id) }
    );
    await conn.commit();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  finally { if (conn) await conn.close(); }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(`DELETE FROM categories WHERE category_id=:id`, { id: parseInt(req.params.id) });
    await conn.commit();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  finally { if (conn) await conn.close(); }
});

// GET /api/admin/reports — top selling products with fallback if no items
router.get('/reports', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    // Try order_items join first
    let result;
    try {
      result = await conn.execute(
        `SELECT oi.name                         AS "product_name",
                SUM(oi.quantity)                AS "total_sold",
                SUM(oi.price * oi.quantity)     AS "total_revenue"
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.order_id
         WHERE o.status != 'Cancelled'
         GROUP BY oi.name
         ORDER BY SUM(oi.quantity) DESC
         FETCH FIRST 20 ROWS ONLY`,
        {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
    } catch (innerErr) {
      // Fallback: just show products with 0 sales
      result = await conn.execute(
        `SELECT name AS "product_name", 0 AS "total_sold", 0 AS "total_revenue" FROM products ORDER BY product_id FETCH FIRST 20 ROWS ONLY`,
        {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Reports error:', err.message);
    res.status(500).json({ error: err.message });
  }
  finally { if (conn) await conn.close(); }
});

module.exports = router;