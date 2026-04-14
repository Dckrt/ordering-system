const express = require('express');
const router  = express.Router();
const oracledb = require('oracledb');
const { getConnection } = require('../db');

// ── Helper: read CLOB field (image_url can be large base64)
async function readClob(clob) {
  if (!clob) return null;
  if (typeof clob === 'string') return clob;
  return new Promise((resolve, reject) => {
    let data = '';
    clob.setEncoding('utf8');
    clob.on('data', chunk => data += chunk);
    clob.on('end',  ()    => resolve(data));
    clob.on('error', err  => reject(err));
  });
}

// GET /api/products
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const category = req.query.category;
    let sql = `SELECT p.product_id  AS "id",
                      p.name        AS "name",
                      p.description AS "description",
                      p.price       AS "price",
                      p.image_url   AS "image",
                      p.in_stock    AS "in_stock",
                      c.name        AS "category"
               FROM products p
               LEFT JOIN categories c ON p.category_id = c.category_id`;
    const binds = {};
    if (category && category !== 'All') {
      sql += ` WHERE c.name = :category`;
      binds.category = category;
    }
    sql += ` ORDER BY p.product_id`;
    const result = await conn.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    // Read CLOB images
    const rows = await Promise.all(result.rows.map(async row => {
      const img = await readClob(row.image);
      return { ...row, image: img };
    }));
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (conn) await conn.close(); }
});

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT name AS "name" FROM categories ORDER BY category_id`,
      {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows.map(r => r.name));
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (conn) await conn.close(); }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT p.product_id  AS "id",
              p.name        AS "name",
              p.description AS "description",
              p.price       AS "price",
              p.image_url   AS "image",
              p.in_stock    AS "in_stock",
              c.name        AS "category"
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       WHERE p.product_id = :id`,
      { id: parseInt(req.params.id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    const row = result.rows[0];
    row.image = await readClob(row.image);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (conn) await conn.close(); }
});

// POST /api/products — add product
router.post('/', async (req, res) => {
  const { category_id, name, description, price, image_url, in_stock } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO products (category_id, name, description, price, image_url, in_stock)
       VALUES (:category_id, :name, :description, :price, :image_url, :in_stock)
       RETURNING product_id INTO :product_id`,
      {
        category_id: category_id || null,
        name,
        description: description || null,
        price:       parseFloat(price) || 0,
        image_url:   image_url || null,
        in_stock:    in_stock !== undefined ? parseInt(in_stock) : 1,
        product_id:  { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    await conn.commit();
    res.json({ success: true, product_id: result.outBinds.product_id[0] });
  } catch (err) {
    console.error('Add product error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally { if (conn) await conn.close(); }
});

// PUT /api/products/:id — update product
router.put('/:id', async (req, res) => {
  const { category_id, name, description, price, image_url, in_stock } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE products
       SET category_id = :category_id,
           name        = :name,
           description = :description,
           price       = :price,
           image_url   = :image_url,
           in_stock    = :in_stock
       WHERE product_id = :id`,
      {
        category_id: category_id || null,
        name,
        description: description || null,
        price:       parseFloat(price) || 0,
        image_url:   image_url || null,
        in_stock:    in_stock !== undefined ? parseInt(in_stock) : 1,
        id:          parseInt(req.params.id)
      }
    );
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally { if (conn) await conn.close(); }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(`DELETE FROM products WHERE product_id = :id`, { id: parseInt(req.params.id) });
    await conn.commit();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  finally { if (conn) await conn.close(); }
});

module.exports = router;