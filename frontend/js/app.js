// ============================================================
// AUTH
// ============================================================
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
    } catch {
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
    } catch {
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
};

// ============================================================
// UTILS
// ============================================================
const Utils = {
  formatCurrency: (amount) => '₱' + parseFloat(amount || 0).toFixed(2),
  formatDate: (dateString) => new Date(dateString).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),

  showToast: (message, type = 'success') => {
    const existing = document.getElementById('toast-notification');
    if (existing) existing.remove();

    const colors = {
      success: { bg: '#dcfce7', border: '#16a34a', text: '#15803d', icon: '✓' },
      error:   { bg: '#fee2e2', border: '#dc2626', text: '#b91c1c', icon: '✕' },
      info:    { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8', icon: 'ℹ' },
    };
    const c = colors[type] || colors.success;

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      background:${c.bg}; border:1px solid ${c.border}; color:${c.text};
      padding:14px 20px; border-radius:10px; font-size:14px; font-weight:500;
      display:flex; align-items:center; gap:10px;
      box-shadow:0 4px 20px rgba(0,0,0,0.12);
      transform:translateY(20px); opacity:0;
      transition:all 0.3s cubic-bezier(.4,0,.2,1);
      max-width:320px;`;
    toast.innerHTML = `
      <span style="width:22px;height:22px;border-radius:50%;background:${c.border};
        color:white;display:flex;align-items:center;justify-content:center;
        font-size:12px;flex-shrink:0;">${c.icon}</span>
      <span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });
    setTimeout(() => {
      toast.style.transform = 'translateY(20px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  showNotification: (message) => Utils.showToast(message, 'success'),
  confirm: (message) => window.confirm(message),

  getStatusBadge: (status) => {
    const map = {
      'Pending':   'badge-warning',
      'Confirmed': 'badge-info',
      'Preparing': 'badge-info',
      'Ready':     'badge-success',
      'Delivered': 'badge-success',
      'Cancelled': 'badge-danger',
    };
    return `<span class="badge ${map[status] || 'badge-info'}">${status}</span>`;
  },
};

// ============================================================
// NAV — update user icon / logout link
// ============================================================
const NavInit = {
  init: () => {
    const user = Auth.getCurrentUser();
    const userLink = document.querySelector('a[href="login.html"].nav-link');
    if (!userLink) return;

    if (user) {
      userLink.href = '#';
      userLink.title = user.FULL_NAME || 'Account';
      userLink.innerHTML = `
        <div style="position:relative;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span style="position:absolute;top:-4px;right:-4px;width:8px;height:8px;
            background:#16a34a;border-radius:50%;border:1px solid white;"></span>
        </div>`;

      // Dropdown
      userLink.addEventListener('click', (e) => {
        e.preventDefault();
        let dd = document.getElementById('user-dropdown');
        if (dd) { dd.remove(); return; }

        dd = document.createElement('div');
        dd.id = 'user-dropdown';
        dd.style.cssText = `
          position:absolute; top:60px; right:16px; z-index:2000;
          background:white; border:1px solid #e5e7eb; border-radius:10px;
          box-shadow:0 8px 24px rgba(0,0,0,0.12); min-width:180px;
          overflow:hidden;`;

        const name = user.FULL_NAME || user.full_name || 'User';
        const role = user.ROLE || user.role;
        dd.innerHTML = `
          <div style="padding:12px 16px;background:#fafafa;border-bottom:1px solid #f0f0f0;">
            <p style="font-size:13px;font-weight:600;color:#111;margin-bottom:2px;">${name}</p>
            <p style="font-size:11px;color:#888;">${user.EMAIL || user.email || ''}</p>
          </div>
          ${role === 'admin' ? `<a href="admin/dashboard.html" style="display:block;padding:10px 16px;font-size:13px;color:#374151;text-decoration:none;transition:background 0.15s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='none'">Admin Panel</a>` : ''}
          <a href="orders.html" style="display:block;padding:10px 16px;font-size:13px;color:#374151;text-decoration:none;transition:background 0.15s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='none'">My Orders</a>
          <button onclick="Auth.logout()" style="display:block;width:100%;text-align:left;padding:10px 16px;font-size:13px;color:#dc2626;background:none;border:none;border-top:1px solid #f0f0f0;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='none'">Sign Out</button>
        `;

        document.querySelector('.header').style.position = 'relative';
        document.querySelector('.header').appendChild(dd);
        setTimeout(() => document.addEventListener('click', () => dd?.remove(), { once: true }), 10);
      });
    }

    // Also update cart icon to open drawer instead of cart.html
    const cartLink = document.querySelector('a[href="cart.html"].nav-link');
    if (cartLink) {
      cartLink.href = '#';
      cartLink.addEventListener('click', (e) => {
        e.preventDefault();
        CartDrawer.open();
      });
    }
  }
};

// ============================================================
// PAGE INIT
// ============================================================
const PageInit = {

  // INDEX
  index: async () => {
    const grid = document.getElementById('featured-products');
    if (!grid) return;
    try {
      const products = await api.getProducts();
      const featured = products.filter(p => p.in_stock == 1).slice(0, 4);
      grid.innerHTML = featured.map(p => `
        <div class="card product-card" style="cursor:pointer;" onclick="addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">
          <img src="${p.image || 'https://via.placeholder.com/400'}" alt="${p.name}" class="card-image"
            onerror="this.src='https://via.placeholder.com/400'" />
          <div class="card-content">
            <h3 class="card-title">${p.name}</h3>
            <p class="card-price">${Utils.formatCurrency(p.price)}</p>
            <button class="btn btn-primary" style="width:100%;margin-top:8px;">Add to Cart</button>
          </div>
        </div>
      `).join('');
    } catch {
      grid.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">Could not load products. Make sure the server is running.</p>';
    }

    window.addToCart = (product) => {
      Cart.addItem({ id: product.id, name: product.name, price: product.price, image: product.image, category: product.category });
      CartDrawer.open();
    };
  },

  // MENU
  menu: async () => {
    let selectedCategory = 'All';
    const productsGrid = document.getElementById('products-grid');
    const categoryFilter = document.getElementById('category-filter');
    if (!productsGrid || !categoryFilter) return;

    const renderCategories = async () => {
      try {
        const cats = await api.getCategories();
        const all = ['All', ...cats];
        categoryFilter.innerHTML = all.map(cat => `
          <button class="category-btn ${cat === selectedCategory ? 'active' : ''}"
            onclick="selectCategory('${cat}')">${cat}</button>
        `).join('');
      } catch {
        categoryFilter.innerHTML = '<button class="category-btn active">All</button>';
      }
    };

    const renderProducts = async () => {
      productsGrid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">
          <div style="width:32px;height:32px;border:3px solid #dc2626;border-top-color:transparent;
            border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div>
          Loading products...
        </div>`;

      try {
        const products = await api.getProducts(selectedCategory === 'All' ? null : selectedCategory);
        if (products.length === 0) {
          productsGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">No products found in this category.</div>`;
          return;
        }
        productsGrid.innerHTML = products.map(p => {
          const available = p.in_stock == 1;
          return `
            <div class="card product-card">
              ${!available ? `<div class="product-overlay"><span class="product-badge badge-unavailable">Unavailable</span></div>` : ''}
              <img src="${p.image || 'https://via.placeholder.com/400'}" alt="${p.name}" class="card-image"
                onerror="this.src='https://via.placeholder.com/400'" />
              <div class="card-content">
                <h3 class="card-title">${p.name}</h3>
                <p class="card-description">${p.description || ''}</p>
                <div class="flex items-center justify-between mb-3">
                  <span class="card-price">${Utils.formatCurrency(p.price)}</span>
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
        productsGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">Failed to load products. Make sure the server is running.</div>`;
      }
    };

    window.selectCategory = (cat) => {
      selectedCategory = cat;
      renderCategories();
      renderProducts();
    };

    window.addToCart = (product) => {
      Cart.addItem({ id: product.id, name: product.name, price: product.price, image: product.image, category: product.category });
      CartDrawer.open();
    };

    // Add spinner keyframe
    if (!document.getElementById('spin-style')) {
      const s = document.createElement('style');
      s.id = 'spin-style';
      s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(s);
    }

    await renderCategories();
    await renderProducts();
  },

  // LOGIN
  login: () => {
    // Redirect if already logged in
    if (Auth.isLoggedIn()) {
      const user = Auth.getCurrentUser();
      window.location.href = (user.ROLE === 'admin' || user.role === 'admin') ? 'admin/dashboard.html' : 'index.html';
      return;
    }

    let isLogin = true;

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const toggleText = document.getElementById('toggle-text');

    window.toggleMode = () => {
      isLogin = !isLogin;
      if (isLogin) {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        pageTitle.textContent = 'Welcome Back';
        pageSubtitle.textContent = 'Sign in to your account';
        toggleText.textContent = "Don't have an account? Register";
      } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        pageTitle.textContent = 'Create Account';
        pageSubtitle.textContent = 'Join us today';
        toggleText.textContent = 'Already have an account? Sign In';
      }
    };

    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('button[type="submit"]');
      btn.textContent = 'Signing in...';
      btn.disabled = true;

      const data = new FormData(loginForm);
      const result = await Auth.login(data.get('email'), data.get('password'));

      if (result.success) {
        Utils.showToast('Login successful! Redirecting...', 'success');
        const redirect = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
        sessionStorage.removeItem('redirectAfterLogin');
        const user = result.user;
        if (user.ROLE === 'admin' || user.role === 'admin') {
          setTimeout(() => window.location.href = 'admin/dashboard.html', 800);
        } else {
          setTimeout(() => window.location.href = redirect, 800);
        }
      } else {
        Utils.showToast(result.message || 'Login failed', 'error');
        btn.textContent = 'Sign In';
        btn.disabled = false;
      }
    });

    registerForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = registerForm.querySelector('button[type="submit"]');
      btn.textContent = 'Creating account...';
      btn.disabled = true;

      const data = new FormData(registerForm);
      const result = await Auth.register({
        full_name: data.get('fullName'),
        email: data.get('email'),
        phone: data.get('phone'),
        password: data.get('password'),
      });

      if (result.success) {
        Utils.showToast('Account created! Redirecting...', 'success');
        setTimeout(() => window.location.href = 'index.html', 800);
      } else {
        Utils.showToast(result.message || 'Registration failed', 'error');
        btn.textContent = 'Create Account';
        btn.disabled = false;
      }
    });
  },

  // CHECKOUT
  checkout: () => {
    if (!Auth.isLoggedIn()) {
      sessionStorage.setItem('redirectAfterLogin', 'checkout.html');
      window.location.href = 'login.html';
      return;
    }

    const items = Cart.getItems();
    if (items.length === 0) {
      Utils.showToast('Your cart is empty!', 'info');
      setTimeout(() => window.location.href = 'menu.html', 1500);
      return;
    }

    const user = Auth.getCurrentUser();
    const form = document.getElementById('checkout-form');

    // Pre-fill user info
    if (user && form) {
      const nameInput = form.querySelector('[name="fullName"]');
      const emailInput = form.querySelector('[name="email"]');
      const phoneInput = form.querySelector('[name="phone"]');
      if (nameInput) nameInput.value = user.FULL_NAME || user.full_name || '';
      if (emailInput) emailInput.value = user.EMAIL || user.email || '';
      if (phoneInput) phoneInput.value = user.PHONE || user.phone || '';
    }

    // Render order summary
    const renderSummary = () => {
      const orderType = document.querySelector('.order-type-btn.active')?.dataset?.type || 'Delivery';
      const deliveryFee = orderType === 'Pick-up' ? 0 : 50;
      const subtotal = Cart.getTotalPrice();
      const total = subtotal + deliveryFee;

      const checkoutItems = document.getElementById('checkout-items');
      if (checkoutItems) {
        checkoutItems.innerHTML = items.map(item => `
          <div style="display:flex;justify-content:space-between;align-items:center;
            padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;">
            <div style="flex:1;min-width:0;margin-right:12px;">
              <p style="font-weight:500;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</p>
              <p style="color:#888;margin-top:1px;">x${item.quantity} @ ₱${parseFloat(item.price).toFixed(2)}</p>
            </div>
            <span style="font-weight:600;color:#111;flex-shrink:0;">₱${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `).join('');
      }

      const deliveryEl = document.getElementById('checkout-delivery');
      if (deliveryEl) deliveryEl.textContent = deliveryFee === 0 ? 'FREE' : '₱50.00';
      const subtotalEl = document.getElementById('checkout-subtotal');
      if (subtotalEl) subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
      const totalEl = document.getElementById('checkout-total');
      if (totalEl) totalEl.textContent = `₱${total.toFixed(2)}`;
    };

    // Order type toggle
    let selectedOrderType = 'Delivery';
    document.querySelectorAll('.order-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedOrderType = btn.dataset.type;
        const addressFields = document.getElementById('address-fields');
        if (addressFields) {
          addressFields.style.display = selectedOrderType === 'Delivery' ? 'block' : 'none';
        }
        renderSummary();
      });
    });

    renderSummary();

    // Submit
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.textContent = 'Placing Order...';
      btn.disabled = true;

      const data = new FormData(form);
      const orderType = selectedOrderType;
      const deliveryFee = orderType === 'Pick-up' ? 0 : 50;
      const subtotal = Cart.getTotalPrice();
      const total = subtotal + deliveryFee;

      const orderData = {
        user_id: user ? (user.USER_ID || user.user_id) : null,
        full_name: data.get('fullName'),
        phone: data.get('phone'),
        email: data.get('email'),
        order_type: orderType,
        address: orderType === 'Delivery' ? data.get('address') : null,
        city: orderType === 'Delivery' ? data.get('city') : null,
        payment_method: data.get('paymentMethod'),
        notes: data.get('notes'),
        subtotal,
        delivery_fee: deliveryFee,
        total,
        items: Cart.getItems().map(i => ({
          product_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      };

      try {
        const result = await api.placeOrder(orderData);
        if (result.success) {
          Cart.clearCart();
          sessionStorage.setItem('lastOrder', JSON.stringify({ ...orderData, order_id: result.order_id }));
          window.location.href = 'confirmation.html';
        } else {
          Utils.showToast(result.message || 'Failed to place order', 'error');
          btn.textContent = 'Place Order';
          btn.disabled = false;
        }
      } catch {
        Utils.showToast('Server error. Please try again.', 'error');
        btn.textContent = 'Place Order';
        btn.disabled = false;
      }
    });
  },

  // CONFIRMATION
  confirmation: () => {
    const order = JSON.parse(sessionStorage.getItem('lastOrder') || 'null');
    if (!order) {
      document.querySelector('main').innerHTML = `
        <div style="text-align:center;padding:80px 20px;">
          <p style="font-size:18px;color:#888;margin-bottom:20px;">No order found.</p>
          <a href="menu.html" class="btn btn-primary">Go to Menu</a>
        </div>`;
      return;
    }

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('order-number', `ORD-${String(order.order_id).padStart(4, '0')}`);
    set('customer-name', order.full_name);
    set('customer-phone', order.phone);
    set('customer-email', order.email);
    set('order-type', order.order_type);
    set('payment-method', order.payment_method);
    set('order-total', Utils.formatCurrency(order.total));

    const addrRow = document.getElementById('address-row');
    const addrEl = document.getElementById('delivery-address');
    if (order.order_type === 'Pick-up') {
      if (addrRow) addrRow.style.display = 'none';
    } else {
      if (addrEl) addrEl.textContent = `${order.address}, ${order.city}`;
    }

    const itemsContainer = document.getElementById('confirmation-items');
    if (itemsContainer && order.items) {
      itemsContainer.innerHTML = order.items.map(item => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;
          border-bottom:1px solid #f3f4f6;font-size:14px;">
          <span style="color:#374151;">${item.name} <span style="color:#888;">x${item.quantity}</span></span>
          <span style="font-weight:600;">₱${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `).join('');
    }
  },

  // ORDERS
  orders: async () => {
    if (!Auth.isLoggedIn()) {
      sessionStorage.setItem('redirectAfterLogin', 'orders.html');
      window.location.href = 'login.html';
      return;
    }

    const user = Auth.getCurrentUser();
    const container = document.getElementById('orders-list');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align:center;padding:40px;color:#888;">
        <div style="width:32px;height:32px;border:3px solid #dc2626;border-top-color:transparent;
          border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div>
        Loading your orders...
      </div>`;

    if (!document.getElementById('spin-style')) {
      const s = document.createElement('style');
      s.id = 'spin-style';
      s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(s);
    }

    try {
      const userId = user.USER_ID || user.user_id;
      const orders = await api.getMyOrders(userId);

      if (!orders || orders.length === 0) {
        container.innerHTML = `
          <div style="text-align:center;padding:80px 20px;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" style="margin:0 auto 16px;">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1" ry="1"/>
            </svg>
            <h2 style="font-size:20px;margin-bottom:8px;color:#374151;">No orders yet</h2>
            <p style="color:#888;margin-bottom:24px;">Start ordering to see your history here.</p>
            <a href="menu.html" class="btn btn-primary">Browse Menu</a>
          </div>`;
        return;
      }

      container.innerHTML = orders.map(order => {
        const orderId = order.ORDER_ID || order.order_id;
        const items = order.items || [];
        return `
          <div class="card" style="margin-bottom:20px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#dc2626,#f97316);
              padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <p style="color:rgba(255,255,255,0.8);font-size:12px;margin-bottom:2px;">Order Number</p>
                <p style="color:white;font-weight:700;font-size:16px;">ORD-${String(orderId).padStart(4,'0')}</p>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
                ${Utils.getStatusBadge(order.STATUS || order.status)}
                <span style="color:rgba(255,255,255,0.8);font-size:11px;">
                  ${Utils.formatDate(order.CREATED_AT || order.created_at)}</span>
              </div>
            </div>
            <div class="card-content">
              <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:14px;">
                <div>
                  <p style="font-size:12px;color:#888;margin-bottom:2px;">Order Type</p>
                  <p style="font-size:14px;font-weight:500;">${order.ORDER_TYPE || order.order_type}</p>
                </div>
                <div>
                  <p style="font-size:12px;color:#888;margin-bottom:2px;">Payment</p>
                  <p style="font-size:14px;font-weight:500;">${order.PAYMENT_METHOD || order.payment_method}</p>
                </div>
              </div>
              ${items.length > 0 ? `
                <div style="border-top:1px solid #f3f4f6;padding-top:12px;margin-bottom:12px;">
                  <p style="font-size:12px;color:#888;margin-bottom:8px;">Items</p>
                  ${items.map(i => `
                    <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#374151;">
                      <span>${i.NAME || i.name} <span style="color:#888;">x${i.QUANTITY || i.quantity}</span></span>
                      <span>₱${((i.PRICE || i.price) * (i.QUANTITY || i.quantity)).toFixed(2)}</span>
                    </div>`).join('')}
                </div>
              ` : ''}
              <div style="display:flex;justify-content:space-between;align-items:center;
                border-top:1px solid #f3f4f6;padding-top:12px;">
                <span style="font-size:13px;color:#888;">Total Amount</span>
                <span style="font-size:18px;font-weight:700;color:#dc2626;">
                  ₱${parseFloat(order.TOTAL || order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>`;
      }).join('');
    } catch (err) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px;color:#888;">
          <p>Failed to load orders. Please try again.</p>
          <button onclick="PageInit.orders()" class="btn btn-primary" style="margin-top:16px;">Retry</button>
        </div>`;
    }
  },

  // CONTACT
  contact: () => {
    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      Utils.showToast('Thank you for your message! We will get back to you soon.', 'success');
      e.target.reset();
    });
  },
};

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  NavInit.init();

  const page = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
  if (PageInit[page]) PageInit[page]();
});