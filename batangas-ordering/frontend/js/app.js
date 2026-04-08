// Main Application Logic — connected to Oracle backend via API

// Authentication (still uses localStorage for session, but validates via Oracle)
const Auth = {
  isLoggedIn: () => !!localStorage.getItem('currentUser'),
  getCurrentUser: () => JSON.parse(localStorage.getItem('currentUser') || 'null'),

  login: async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res.success) {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Invalid credentials' };
    } catch (err) {
      return { success: false, message: 'Server error. Please try again.' };
    }
  },

  register: async (userData) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      }).then(r => r.json());

      if (res.success) {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      return { success: false, message: 'Server error. Please try again.' };
    }
  },

  logout: () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  },

  isAdmin: () => {
    const user = Auth.getCurrentUser();
    return user && user.ROLE === 'admin';
  },

  requireLogin: () => {
    if (!Auth.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  requireAdmin: () => {
    if (!Auth.isAdmin()) {
      alert('Access denied. Admin only.');
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },
};

// Utility Functions
const Utils = {
  formatCurrency: (amount) => '₱' + parseFloat(amount || 0).toFixed(2),

  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  },

  showNotification: (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    Object.assign(notification.style, {
      position: 'fixed', top: '20px', right: '20px',
      zIndex: '10000', minWidth: '300px'
    });
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  },

  confirm: (message) => window.confirm(message),
};

// Page-specific initialization
const PageInit = {

  // Index page — load featured products from Oracle
  index: async () => {
    const grid = document.getElementById('featured-products');
    if (!grid) return;

    try {
      const products = await api.getProducts();
      const featured = products.filter(p => p.IN_STOCK == 1).slice(0, 4);

      if (featured.length === 0) {
        grid.innerHTML = '<p style="color:var(--gray-500); text-align:center; grid-column:span 4;">No products available.</p>';
        return;
      }

      grid.innerHTML = featured.map(p => `
        <div class="card product-card">
          <img src="${p.IMAGE || 'https://via.placeholder.com/400'}" alt="${p.NAME}" class="card-image" />
          <div class="card-content">
            <h3 class="card-title">${p.NAME}</h3>
            <p class="card-price">${Utils.formatCurrency(p.PRICE)}</p>
          </div>
        </div>
      `).join('');
    } catch (err) {
      grid.innerHTML = '<p style="color:var(--gray-500); text-align:center; grid-column:span 4;">Failed to load products.</p>';
    }
  },

  // Menu page — load products & categories from Oracle
  menu: async () => {
    let selectedCategory = 'All';
    const productsGrid = document.getElementById('products-grid');
    const categoryFilter = document.getElementById('category-filter');

    const renderCategories = async () => {
      try {
        const cats = await api.getCategories();
        const all = ['All', ...cats];
        categoryFilter.innerHTML = all.map(cat => `
          <button class="category-btn ${cat === selectedCategory ? 'active' : ''}"
                  onclick="selectCategory('${cat}')">
            ${cat}
          </button>
        `).join('');
      } catch {
        categoryFilter.innerHTML = '';
      }
    };

    const renderProducts = async () => {
      productsGrid.innerHTML = '<p style="color:var(--gray-500); grid-column:span 4; text-align:center;">Loading...</p>';
      try {
        const products = await api.getProducts(selectedCategory === 'All' ? null : selectedCategory);

        if (products.length === 0) {
          productsGrid.innerHTML = '<p style="color:var(--gray-500); grid-column:span 4; text-align:center;">No products found.</p>';
          return;
        }

        productsGrid.innerHTML = products.map(p => {
          const available = p.IN_STOCK == 1;
          return `
            <div class="card product-card">
              ${!available ? `
                <div class="product-overlay">
                  <span class="product-badge badge-unavailable">Unavailable</span>
                </div>` : ''}
              <img src="${p.IMAGE || 'https://via.placeholder.com/400'}" alt="${p.NAME}" class="card-image" />
              <div class="card-content">
                <h3 class="card-title">${p.NAME}</h3>
                <p class="card-description">${p.DESCRIPTION || ''}</p>
                <div class="flex items-center justify-between mb-3">
                  <span class="card-price">${Utils.formatCurrency(p.PRICE)}</span>
                  <span class="badge ${available ? 'badge-success' : 'badge-danger'}">
                    ${available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <button onclick="addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})"
                        class="btn btn-primary" style="width:100%;"
                        ${!available ? 'disabled' : ''}>
                  Add to Cart
                </button>
              </div>
            </div>`;
        }).join('');
      } catch {
        productsGrid.innerHTML = '<p style="color:var(--gray-500); grid-column:span 4; text-align:center;">Failed to load products.</p>';
      }
    };

    window.selectCategory = (category) => {
      selectedCategory = category;
      renderCategories();
      renderProducts();
    };

    window.addToCart = (product) => {
      Cart.addItem({
        id: product.PRODUCT_ID,
        name: product.NAME,
        price: product.PRICE,
        image: product.IMAGE,
        category: product.CATEGORY,
      });
      Utils.showNotification('Added to cart!');
    };

    await renderCategories();
    await renderProducts();
  },

  // Cart page — unchanged, reads from localStorage
  cart: () => {
    const renderCart = () => {
      const cart = Cart.getCart();
      const cartItems    = document.getElementById('cart-items');
      const emptyState   = document.getElementById('empty-cart');
      const cartContent  = document.getElementById('cart-content');
      const subtotalEl   = document.getElementById('subtotal');
      const deliveryEl   = document.getElementById('delivery-fee');
      const totalEl      = document.getElementById('total');

      if (cart.length === 0) {
        emptyState.classList.remove('hidden');
        cartContent.classList.add('hidden');
        return;
      }
      emptyState.classList.add('hidden');
      cartContent.classList.remove('hidden');

      cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
          <img src="${item.image || 'https://via.placeholder.com/96'}" alt="${item.name}" class="cart-item-image" />
          <div class="cart-item-details">
            <div class="flex justify-between mb-2">
              <div>
                <h3 class="cart-item-title">${item.name}</h3>
                <p class="cart-item-category">${item.category}</p>
              </div>
              <button onclick="removeFromCart(${item.id})" class="icon-btn delete">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
            <div class="flex items-center justify-between">
              <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
              <span style="font-size:1.125rem; font-weight:600;">${Utils.formatCurrency(item.price * item.quantity)}</span>
            </div>
          </div>
        </div>
      `).join('');

      const subtotal = Cart.getTotalPrice();
      const fee = 50;
      subtotalEl.textContent  = Utils.formatCurrency(subtotal);
      deliveryEl.textContent  = Utils.formatCurrency(fee);
      totalEl.textContent     = Utils.formatCurrency(subtotal + fee);
    };

    window.removeFromCart = (id) => {
      if (Utils.confirm('Remove this item?')) { Cart.removeItem(id); renderCart(); }
    };
    window.updateQuantity = (id, qty) => { Cart.updateQuantity(id, qty); renderCart(); };
    renderCart();
  },

  // Checkout page — submits order to Oracle via API
  checkout: () => {
    const cart = Cart.getCart();
    if (cart.length === 0) { window.location.href = 'index.html'; return; }

    let orderType = 'Delivery';
    let deliveryFee = 50;

    const updateSummary = () => {
      document.getElementById('checkout-items').innerHTML = cart.map(item => `
        <div class="summary-row" style="font-size:0.875rem;">
          <span>${item.name} × ${item.quantity}</span>
          <span>${Utils.formatCurrency(item.price * item.quantity)}</span>
        </div>
      `).join('');

      const subtotal = Cart.getTotalPrice();
      deliveryFee = orderType === 'Delivery' ? 50 : 0;
      document.getElementById('checkout-subtotal').textContent = Utils.formatCurrency(subtotal);
      document.getElementById('checkout-delivery').textContent = Utils.formatCurrency(deliveryFee);
      document.getElementById('checkout-total').textContent    = Utils.formatCurrency(subtotal + deliveryFee);
    };

    document.querySelectorAll('.order-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        orderType = btn.dataset.type;
        document.getElementById('address-fields').classList.toggle('hidden', orderType !== 'Delivery');
        updateSummary();
      });
    });

    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const currentUser = Auth.getCurrentUser();
      const subtotal = Cart.getTotalPrice();

      const orderData = {
        user_id:        currentUser ? currentUser.USER_ID : null,
        full_name:      fd.get('fullName'),
        phone:          fd.get('phone'),
        email:          fd.get('email'),
        order_type:     orderType,
        address:        fd.get('address') || '',
        city:           fd.get('city') || 'Naga City',
        payment_method: fd.get('paymentMethod'),
        notes:          fd.get('notes') || '',
        subtotal,
        delivery_fee:   deliveryFee,
        total:          subtotal + deliveryFee,
        items: cart.map(item => ({
          product_id: item.id,
          name:       item.name,
          price:      item.price,
          quantity:   item.quantity,
        })),
      };

      try {
        const res = await api.placeOrder(orderData);
        if (res.success) {
          localStorage.setItem('lastOrderId', res.order_id);
          localStorage.setItem('lastOrderData', JSON.stringify({ ...orderData, order_id: res.order_id }));
          Cart.clearCart();
          window.location.href = 'confirmation.html';
        } else {
          Utils.showNotification(res.message || 'Failed to place order', 'error');
        }
      } catch {
        Utils.showNotification('Server error. Please try again.', 'error');
      }
    });

    updateSummary();
  },

  // Confirmation page
  confirmation: () => {
    const order = JSON.parse(localStorage.getItem('lastOrderData') || 'null');
    if (!order) { window.location.href = 'index.html'; return; }

    document.getElementById('order-number').textContent  = `ORD-${String(order.order_id).padStart(3,'0')}`;
    document.getElementById('customer-name').textContent = order.full_name;
    document.getElementById('order-type').textContent    = order.order_type;
    document.getElementById('payment-method').textContent= order.payment_method;
    document.getElementById('customer-phone').textContent= order.phone;
    document.getElementById('customer-email').textContent= order.email;
    document.getElementById('order-status').textContent  = 'Pending';

    const addrRow = document.getElementById('address-row');
    if (order.address) {
      document.getElementById('delivery-address').textContent = `${order.address}, ${order.city}`;
    } else {
      if (addrRow) addrRow.style.display = 'none';
    }

    document.getElementById('confirmation-items').innerHTML = order.items.map(item => `
      <div class="flex justify-between" style="font-size:0.875rem; margin-bottom:var(--space-2);">
        <span style="color:var(--gray-600);">${item.name} × ${item.quantity}</span>
        <span>${Utils.formatCurrency(item.price * item.quantity)}</span>
      </div>
    `).join('');

    document.getElementById('order-total').textContent = Utils.formatCurrency(order.total);
  },

  // Login page — now calls Oracle via API
  login: () => {
    let isLoginMode = true;

    window.toggleMode = () => {
      isLoginMode = !isLoginMode;
      document.getElementById('login-form').classList.toggle('hidden');
      document.getElementById('register-form').classList.toggle('hidden');
      document.getElementById('page-title').textContent    = isLoginMode ? 'Welcome Back' : 'Create Account';
      document.getElementById('page-subtitle').textContent = isLoginMode ? 'Sign in to your account' : 'Register to start ordering';
    };

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const result = await Auth.login(fd.get('email'), fd.get('password'));
      if (result.success) {
        Utils.showNotification('Login successful!');
        setTimeout(() => {
          window.location.href = result.user.ROLE === 'admin' ? 'admin/dashboard.html' : 'index.html';
        }, 500);
      } else {
        Utils.showNotification(result.message, 'error');
      }
    });

    document.getElementById('register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const result = await Auth.register({
        full_name: fd.get('fullName'),
        email:     fd.get('email'),
        password:  fd.get('password'),
        phone:     fd.get('phone'),
      });
      if (result.success) {
        Utils.showNotification('Registration successful!');
        setTimeout(() => { window.location.href = 'index.html'; }, 500);
      } else {
        Utils.showNotification(result.message, 'error');
      }
    });
  },

  // Orders page — loads from Oracle for logged-in user
  orders: async () => {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) { window.location.href = 'login.html'; return; }

    const container = document.getElementById('orders-list');
    container.innerHTML = '<p style="text-align:center; color:var(--gray-500);">Loading orders...</p>';

    try {
      const orders = await api.getMyOrders(currentUser.USER_ID);

      if (!orders || orders.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <h2>No orders yet</h2>
            <p>Start shopping to see your orders here</p>
            <a href="menu.html" class="btn btn-primary mt-6">Browse Menu</a>
          </div>`;
        return;
      }

      container.innerHTML = orders.map(order => `
        <div class="card mb-4">
          <div style="background: linear-gradient(135deg, var(--primary-red), var(--primary-orange)); color:white; padding:var(--space-4);">
            <div class="flex justify-between">
              <div>
                <p style="font-size:0.875rem; opacity:0.9;">Order Number</p>
                <p style="font-size:1.25rem; font-weight:600;">ORD-${String(order.ORDER_ID).padStart(3,'0')}</p>
              </div>
              <div class="text-right">
                <p style="font-size:0.875rem; opacity:0.9;">Order Date</p>
                <p>${Utils.formatDate(order.CREATED_AT)}</p>
              </div>
            </div>
          </div>
          <div class="card-content">
            <div class="mb-4">
              ${(order.items || []).map(item => `
                <div class="flex justify-between" style="font-size:0.875rem; margin-bottom:var(--space-2);">
                  <span>${item.NAME} × ${item.QUANTITY}</span>
                  <span>${Utils.formatCurrency(item.PRICE * item.QUANTITY)}</span>
                </div>
              `).join('')}
            </div>
            <div class="flex justify-between items-center" style="padding-top:var(--space-4); border-top:1px solid var(--gray-200);">
              <span class="badge badge-${order.STATUS === 'Pending' ? 'warning' : order.STATUS === 'Delivered' ? 'success' : 'info'}">
                ${order.STATUS}
              </span>
              <div class="text-right">
                <p style="font-size:0.875rem; color:var(--gray-500);">Total Amount</p>
                <p style="font-size:1.5rem; color:var(--primary-red); font-weight:600;">
                  ${Utils.formatCurrency(order.TOTAL)}
                </p>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    } catch {
      container.innerHTML = '<p style="text-align:center; color:var(--primary-red);">Failed to load orders.</p>';
    }
  },
};

// Initialize page on load
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const page = path.split('/').pop().replace('.html', '') || 'index';
  if (PageInit[page]) PageInit[page]();
});