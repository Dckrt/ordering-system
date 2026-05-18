const express  = require('express');
const router   = express.Router();
const oracledb = require('oracledb');
const { getConnection } = require('../db');

// ─────────────────────────────────────────────
// Helper: insert a notification safely
// Uses notifications_seq for NOTIFICATION_ID
// ─────────────────────────────────────────────
async function insertNotification(conn, { user_id, order_id, message }) {
  await conn.execute(
    `INSERT INTO notifications (notification_id, user_id, order_id, message, is_read, created_at)
     VALUES (notifications_seq.NEXTVAL, :user_id, :order_id, :message, 0, SYSDATE)`,
    { user_id, order_id: order_id || null, message }
  );
  console.log(`✅ Notification → user ${user_id}, order ${order_id}: ${message}`);
}

// ─────────────────────────────────────────────
// POST /api/orders — place order
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { user_id, full_name, phone, email, order_type, address, city,
          payment_method, notes, subtotal, delivery_fee, total, items } = req.body;
  if (!full_name || !phone || !email || !items || !items.length)
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  let conn;
  try {
    conn = await getConnection();
    const orderResult = await conn.execute(
      `INSERT INTO orders (user_id,full_name,phone,email,order_type,address,city,payment_method,notes,subtotal,delivery_fee,total,status)
       VALUES (:user_id,:full_name,:phone,:email,:order_type,:address,:city,:payment_method,:notes,:subtotal,:delivery_fee,:total,'Pending')
       RETURNING order_id INTO :order_id`,
      {
        user_id: user_id || null, full_name, phone, email,
        order_type: order_type || 'Delivery', address: address || null,
        city: city || 'Naga City', payment_method: payment_method || 'Cash',
        notes: notes || null, subtotal: subtotal || 0,
        delivery_fee: delivery_fee !== undefined ? delivery_fee : 50,
        total: total || 0,
        order_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    const orderId = orderResult.outBinds.order_id[0];

    for (const item of items) {
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, name, price, quantity)
         VALUES (:order_id, :product_id, :name, :price, :quantity)`,
        { order_id: orderId, product_id: item.product_id || null, name: item.name, price: item.price, quantity: item.quantity }
      );
    }

    // Notify buyer that order was placed
    if (user_id) {
      try {
        await insertNotification(conn, {
          user_id,
          order_id: orderId,
          message: `ORD-${String(orderId).padStart(4,'0')}: Your order has been placed! We will confirm it shortly.`
        });
      } catch (e) { console.warn('⚠️ Order-placed notification failed:', e.message); }
    }

    await conn.commit();
    res.json({ success: true, order_id: orderId });
  } catch (err) {
    if (conn) try { await conn.rollback(); } catch {}
    console.error('Place order error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally { if (conn) await conn.close(); }
});

// ─────────────────────────────────────────────
// GET /api/orders/notifications/:userId
// ─────────────────────────────────────────────
router.get('/notifications/:userId', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT notification_id AS "id",
              message         AS "message",
              is_read         AS "is_read",
              order_id        AS "order_id",
              TO_CHAR(created_at,'YYYY-MM-DD"T"HH24:MI:SS') AS "created_at"
       FROM (
         SELECT notification_id, message, is_read, order_id, created_at
         FROM notifications
         WHERE user_id = :user_id
         ORDER BY created_at DESC
       ) WHERE ROWNUM <= 20`,
      { user_id: parseInt(req.params.userId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get notifications error:', err.message);
    res.json([]);
  } finally { if (conn) await conn.close(); }
});

// ─────────────────────────────────────────────
// PUT /api/orders/notifications/:userId/read
// ─────────────────────────────────────────────
router.put('/notifications/:userId/read', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE notifications SET is_read = 1 WHERE user_id = :id`,
      { id: parseInt(req.params.userId) }
    );
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    console.error('Mark notifications read error:', err.message);
    res.json({ success: false });
  } finally { if (conn) await conn.close(); }
});

// ─────────────────────────────────────────────
// GET /api/orders/user/:userId
// ─────────────────────────────────────────────
router.get('/user/:userId', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const ordersResult = await conn.execute(
      `SELECT o.order_id       AS "order_id",
              o.full_name      AS "full_name",
              o.phone          AS "phone",
              o.email          AS "email",
              o.order_type     AS "order_type",
              o.address        AS "address",
              o.city           AS "city",
              o.payment_method AS "payment_method",
              o.notes          AS "notes",
              o.subtotal       AS "subtotal",
              o.delivery_fee   AS "delivery_fee",
              o.total          AS "total",
              o.status         AS "status",
              TO_CHAR(o.created_at,'YYYY-MM-DD"T"HH24:MI:SS') AS "created_at"
       FROM orders o
       WHERE o.user_id = :user_id
       ORDER BY o.created_at DESC`,
      { user_id: parseInt(req.params.userId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const orders = ordersResult.rows;
    for (const order of orders) {
      const itemsResult = await conn.execute(
        `SELECT name AS "name", price AS "price", quantity AS "quantity"
         FROM order_items WHERE order_id = :order_id`,
        { order_id: order.order_id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      order.items = itemsResult.rows;
    }
    res.json(orders);
  } catch (err) {
    console.error('getMyOrders error:', err.message);
    res.status(500).json({ error: err.message });
  } finally { if (conn) await conn.close(); }
});

// ─────────────────────────────────────────────
// GET /api/orders — all orders (admin)
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT o.order_id       AS "order_id",
              o.user_id        AS "user_id",
              o.full_name      AS "full_name",
              o.phone          AS "phone",
              o.email          AS "email",
              o.order_type     AS "order_type",
              o.address        AS "address",
              o.city           AS "city",
              o.payment_method AS "payment_method",
              o.subtotal       AS "subtotal",
              o.delivery_fee   AS "delivery_fee",
              o.total          AS "total",
              o.status         AS "status",
              TO_CHAR(o.created_at,'YYYY-MM-DD"T"HH24:MI:SS') AS "created_at"
       FROM orders o
       ORDER BY o.created_at DESC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const orders = result.rows;
    for (const order of orders) {
      const itemsResult = await conn.execute(
        `SELECT name AS "name", price AS "price", quantity AS "quantity"
         FROM order_items WHERE order_id = :order_id`,
        { order_id: order.order_id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      order.items = itemsResult.rows;
    }
    res.json(orders);
  } catch (err) {
    console.error('getAllOrders error:', err.message);
    res.status(500).json({ error: err.message });
  } finally { if (conn) await conn.close(); }
});

// ─────────────────────────────────────────────
// PUT /api/orders/:id/status — update + notify buyer
// ─────────────────────────────────────────────
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  const valid = ['Pending','Confirmed','Preparing','Ready','Delivered','Cancelled'];
  if (!valid.includes(status))
    return res.status(400).json({ success: false, message: 'Invalid status' });

  const statusMessages = {
    Confirmed: 'Your order has been confirmed! We are preparing it soon. 🎉',
    Preparing: 'Your order is now being prepared! 👨‍🍳',
    Ready:     'Your order is ready for pickup/delivery! 📦',
    Delivered: 'Your order has been delivered. Enjoy your meal! 🍽️',
    Cancelled: 'Your order has been cancelled. Contact us for concerns.'
  };

  let conn;
  try {
    conn = await getConnection();

    // 1. Update order status
    await conn.execute(
      `UPDATE orders SET status = :status WHERE order_id = :id`,
      { status, id: parseInt(req.params.id) }
    );

    // 2. Get user_id of the order
    const orderRes = await conn.execute(
      `SELECT user_id AS "user_id" FROM orders WHERE order_id = :id`,
      { id: parseInt(req.params.id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const userId  = orderRes.rows[0]?.user_id;
    const orderId = parseInt(req.params.id);

    // 3. Insert notification to buyer
    if (userId && statusMessages[status]) {
      try {
        await insertNotification(conn, {
          user_id:  userId,
          order_id: orderId,
          message:  `ORD-${String(orderId).padStart(4,'0')}: ${statusMessages[status]}`
        });
      } catch (e) {
        console.warn('⚠️ Status notification failed:', e.message);
      }
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    console.error('updateStatus error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally { if (conn) await conn.close(); }
});

// ─────────────────────────────────────────────
// POST /api/orders/:id/notify — manual notify
// ─────────────────────────────────────────────
router.post('/:id/notify', async (req, res) => {
  const { status } = req.body;
  const orderId = parseInt(req.params.id);
  let conn;
  try {
    conn = await getConnection();
    const orderRes = await conn.execute(
      `SELECT user_id AS "user_id" FROM orders WHERE order_id = :id`,
      { id: orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!orderRes.rows.length) return res.json({ success: false, message: 'Order not found' });
    const userId = orderRes.rows[0].user_id;
    if (!userId) return res.json({ success: true, message: 'Guest order — no notification sent' });

    await insertNotification(conn, {
      user_id:  userId,
      order_id: orderId,
      message:  `ORD-${String(orderId).padStart(4,'0')}: Your order status has been updated to ${status}.`
    });
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    console.error('Manual notify error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally { if (conn) await conn.close(); }
});

module.exports = router;