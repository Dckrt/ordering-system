// API client — connects frontend to Oracle backend via Express
// ⚠️  Change this IP to the IPv4 address of your server computer
const API_BASE = 'http://172.20.10.3:3000/api';

// NOTE: SERVER_BASE is declared in app.js as:
//   const SERVER_BASE = API_BASE.replace('/api', '');
// Do NOT declare SERVER_BASE here — it will cause a duplicate declaration error.

const api = {

  // ── PRODUCTS ──────────────────────────────────────────────
  getProducts: (category) =>
    fetch(`${API_BASE}/products${category ? '?category=' + encodeURIComponent(category) : ''}`)
      .then(r => r.json()),

  getCategories: () =>
    fetch(`${API_BASE}/products/categories`)
      .then(r => r.json()),

  // ── ORDERS ────────────────────────────────────────────────
  placeOrder: (orderData) =>
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    }).then(r => r.json()),

  getMyOrders: (userId) =>
    fetch(`${API_BASE}/orders/user/${userId}`)
      .then(r => r.json()),

  updateOrderStatus: (orderId, status) =>
    fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(r => r.json()),

  // ── ADMIN ─────────────────────────────────────────────────
  getAllOrders: () =>
    fetch(`${API_BASE}/orders`)
      .then(r => r.json()),

  getDashboard: () =>
    fetch(`${API_BASE}/admin/dashboard`)
      .then(r => r.json()),

  getCustomers: () =>
    fetch(`${API_BASE}/admin/customers`)
      .then(r => r.json())
      .then(data => Array.isArray(data) ? data : []),

  getAllUsers: () =>
    fetch(`${API_BASE}/admin/all-users`)
      .then(r => r.json())
      .then(data => Array.isArray(data) ? data : []),

  getReports: () =>
    fetch(`${API_BASE}/admin/reports`)
      .then(r => r.json())
      .then(data => Array.isArray(data) ? data : [])
      .catch(() => []),

  // ── MESSAGES (Contact) ────────────────────────────────────
  getMessages: () =>
    fetch(`${API_BASE}/contact`)
      .then(r => r.json())
      .then(data => Array.isArray(data) ? data : [])
      .catch(() => []),

  markMessageRead: (id) =>
    fetch(`${API_BASE}/contact/${id}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }).then(r => r.json()),

  deleteMessage: (id) =>
    fetch(`${API_BASE}/contact/${id}`, {
      method: 'DELETE'
    }).then(r => r.json()),

  sendMessage: (data) =>
    fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // ── ADMIN CATEGORIES ──────────────────────────────────────
  getCategories_admin: () =>
    fetch(`${API_BASE}/admin/categories`)
      .then(r => r.json()),

  addCategory: (data) =>
    fetch(`${API_BASE}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  updateCategory: (id, data) =>
    fetch(`${API_BASE}/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  deleteCategory: (id) =>
    fetch(`${API_BASE}/admin/categories/${id}`, { method: 'DELETE' })
      .then(r => r.json()),

  // ── ADMIN PRODUCTS ────────────────────────────────────────
  addProduct: (data) =>
    fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  updateProduct: (id, data) =>
    fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  deleteProduct: (id) =>
    fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' })
      .then(r => r.json()),

  // ── CUSTOMERS (Admin) ─────────────────────────────────────
  updateCustomerStatus: (id, status, requesterId) =>
    fetch(`${API_BASE}/admin/customers/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, requester_id: requesterId })
    }).then(r => r.json()),

  deleteCustomer: (id, requesterId) =>
    fetch(`${API_BASE}/admin/customers/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester_id: requesterId })
    }).then(r => r.json()),

  // ── AUTH ──────────────────────────────────────────────────
  login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(r => r.json()),
};