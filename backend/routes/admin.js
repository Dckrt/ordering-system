const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const { getConnection } = require('../db');

// GET /api/admin/dashboard — summary stats
router.get('/dashboard', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const [ordersTotal, revenue, customers, products] = await Promise.all([
      conn.execute(`SELECT COUNT(*) AS cnt FROM orders`, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
      conn.execute(`SELECT NVL(SUM(total), 0) AS total FROM orders WHERE status != 'Cancelled'`, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
      conn.execute(`SELECT COUNT(*) AS cnt FROM users WHERE role = 'customer'`, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
      conn.execute(`SELECT COUNT(*) AS cnt FROM products`, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
    ]);

    res.json({
      total_orders:    ordersTotal.rows[0].CNT,
      total_revenue:   revenue.rows[0].TOTAL,
      total_customers: customers.rows[0].CNT,
      total_products:  products.rows[0].CNT,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/admin/customers — all customers
router.get('/customers', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT user_id, full_name, email, phone, role,
              TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
       FROM users
       ORDER BY created_at DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/admin/categories — all categories
router.get('/categories', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT category_id, name, description FROM categories ORDER BY category_id`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/admin/categories — add category
router.post('/categories', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name required' });
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO categories (name, description)
       VALUES (:name, :description)
       RETURNING category_id INTO :category_id`,
      {
        name,
        description: description || null,
        category_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    await conn.commit();
    res.json({ success: true, category_id: result.outBinds.category_id[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// PUT /api/admin/categories/:id — update category
router.put('/categories/:id', async (req, res) => {
  const { name, description } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE categories SET name = :name, description = :description WHERE category_id = :id`,
      { name, description: description || null, id: parseInt(req.params.id) }
    );
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// DELETE /api/admin/categories/:id — delete category
router.delete('/categories/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `DELETE FROM categories WHERE category_id = :id`,
      { id: parseInt(req.params.id) }
    );
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/admin/reports — sales summary by product
router.get('/reports', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT oi.name AS product_name,
              SUM(oi.quantity) AS total_sold,
              SUM(oi.price * oi.quantity) AS total_revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE o.status != 'Cancelled'
       GROUP BY oi.name
       ORDER BY total_revenue DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;