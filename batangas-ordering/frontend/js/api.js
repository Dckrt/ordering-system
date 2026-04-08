const API_BASE = 'http://localhost:3000/api';

const api = {
  // Products
  getProducts: (category) =>
    fetch(`${API_BASE}/products${category ? '?category='+category : ''}`)
      .then(r => r.json()),

  // Orders
  placeOrder: (orderData) =>
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    }).then(r => r.json()),

  getMyOrders: (userId) =>
    fetch(`${API_BASE}/orders/user/${userId}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    }).then(r => r.json()),

  // Auth
  login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(r => r.json()),
};