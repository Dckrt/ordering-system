// API client — connects frontend to Oracle backend via Express

const API_BASE = 'http://localhost:3000/api';

const api = {
  // Products
  getProducts: (category) =>
    fetch(`${API_BASE}/products${category ? '?category=' + encodeURIComponent(category) : ''}`)
      .then(r => r.json()),

  getCategories: () =>
    fetch(`${API_BASE}/products/categories`)
      .then(r => r.json()),

  // Orders
  placeOrder: (orderData) =>
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    }).then(r => r.json()),

  getMyOrders: (userId) =>
    fetch(`${API_BASE}/orders/user/${userId}`)
      .then(r => r.json()),

  // Admin
  getDashboard: () =>
    fetch(`${API_BASE}/admin/dashboard`).then(r => r.json()),

  getAllOrders: () =>
    fetch(`${API_BASE}/admin/orders` // uses GET /api/orders
      .replace('/admin/orders', '/orders'))
      .then(r => r.json()),

  updateOrderStatus: (orderId, status) =>
    fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(r => r.json()),

  getCustomers: () =>
    fetch(`${API_BASE}/admin/customers`).then(r => r.json()),

  getCategories_admin: () =>
    fetch(`${API_BASE}/admin/categories`).then(r => r.json()),

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

  getReports: () =>
    fetch(`${API_BASE}/admin/reports`).then(r => r.json()),

  // Auth
  login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(r => r.json()),
};