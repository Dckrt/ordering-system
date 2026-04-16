// API client — connects frontend to Oracle backend via Express
const API_BASE = 'http://localhost:3000/api';

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

  // getCustomers — returns non-admin users only (used in customers.html)
  getCustomers: () =>
    fetch(`${API_BASE}/admin/customers`)
      .then(r => r.json())
      .then(data => Array.isArray(data) ? data : []),

  // getAllUsers — returns ALL users including admins (also used in customers.html)
  getAllUsers: () =>
    fetch(`${API_BASE}/admin/all-users`)
      .then(r => r.json())
      .then(data => Array.isArray(data) ? data : []),

  // getReports — ALWAYS returns an array, never throws
  getReports: () =>
    fetch(`${API_BASE}/admin/reports`)
      .then(r => r.json())
      .then(data => Array.isArray(data) ? data : [])
      .catch(() => []),

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

  // ── AUTH ──────────────────────────────────────────────────
  login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(r => r.json()),
};