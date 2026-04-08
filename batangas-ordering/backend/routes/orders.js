const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const { getConnection } = require('../db');

// POST /api/orders — place a new order
router.post('/', async (req, res) => {
  const {
    user_id,
    full_name,
    phone,
    email,
    order_type,
    address,
    city,
    payment_method,
    notes,
    subtotal,
    delivery_fee,
    total,
    items   // array of { product_id, name, price, quantity }
  } = req.body;

  if (!full_name || !phone || !email || !items || items.length === 0)
    return res.status(400).json({ success: false, message: 'Missing required fields' });

  let conn;
  try {
    conn = await getConnection();

    // Insert order
    const orderResult = await conn.execute(
      `INSERT INTO orders
         (user_id, full_name, phone, email, order_type, address, city,
          payment_method, notes, subtotal, delivery_fee, total, status)
       VALUES
         (:user_id, :full_name, :phone, :email, :order_type, :address, :city,
          :payment_method, :notes, :subtotal, :delivery_fee, :total, 'Pending')
       RETURNING order_id INTO :order_id`,
      {
        user_id:        user_id || null,
        full_name,
        phone,
        email,
        order_type:     order_type || 'Delivery',
        address:        address || null,
        city:           city || 'Naga City',
        payment_method: payment_method || 'Cash',
        notes:          notes || null,
        subtotal:       subtotal || 0,
        delivery_fee:   delivery_fee !== undefined ? delivery_fee : 50,
        total:          total || 0,
        order_id:       { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    const orderId = orderResult.outBinds.order_id[0];

    // Insert each order item
    for (const item of items) {
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, name, price, quantity)
         VALUES (:order_id, :product_id, :name, :price, :quantity)`,
        {
          order_id:   orderId,
          product_id: item.product_id || null,
          name:       item.name,
          price:      item.price,
          quantity:   item.quantity
        }
      );
    }

    await conn.commit();
    res.json({ success: true, order_id: orderId });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/orders/user/:userId — get orders for a specific customer
router.get('/user/:userId', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const ordersResult = await conn.execute(
      `SELECT o.order_id, o.full_name, o.phone, o.email, o.order_type,
              o.address, o.city, o.payment_method, o.notes,
              o.subtotal, o.delivery_fee, o.total, o.status,
              TO_CHAR(o.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
       FROM orders o
       WHERE o.user_id = :user_id
       ORDER BY o.created_at DESC`,
      { user_id: parseInt(req.params.userId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const orders = ordersResult.rows;

    // Attach items to each order
    for (const order of orders) {
      const itemsResult = await conn.execute(
        `SELECT name, price, quantity FROM order_items WHERE order_id = :order_id`,
        { order_id: order.ORDER_ID },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      order.items = itemsResult.rows;
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/orders — admin: get all orders
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT o.order_id, o.full_name, o.phone, o.email, o.order_type,
              o.address, o.city, o.payment_method, o.subtotal,
              o.delivery_fee, o.total, o.status,
              TO_CHAR(o.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
       FROM orders o
       ORDER BY o.created_at DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const orders = result.rows;
    for (const order of orders) {
      const itemsResult = await conn.execute(
        `SELECT name, price, quantity FROM order_items WHERE order_id = :order_id`,
        { order_id: order.ORDER_ID },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      order.items = itemsResult.rows;
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// PUT /api/orders/:id/status — admin: update order status
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ success: false, message: 'Invalid status' });

  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE orders SET status = :status WHERE order_id = :id`,
      { status, id: parseInt(req.params.id) }
    );
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;