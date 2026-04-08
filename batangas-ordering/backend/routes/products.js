const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const { getConnection } = require('../db');

// GET all products (optionally filter by category)
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const category = req.query.category;
    let sql = `SELECT p.*, c.name AS category_name 
               FROM products p JOIN categories c ON p.category_id = c.category_id`;
    const binds = {};
    if (category && category !== 'All') {
      sql += ` WHERE c.name = :category`;
      binds.category = category;
    }
    const result = await conn.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;