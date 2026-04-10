// ============================================================
// AUTH
// ============================================================
const Auth = {
  isLoggedIn: () => !!localStorage.getItem('currentUser'),
  getCurrentUser: () => JSON.parse(localStorage.getItem('currentUser') || 'null'),
  login: async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res.success) { localStorage.setItem('currentUser', JSON.stringify(res.user)); return { success: true, user: res.user }; }
      return { success: false, message: res.message || 'Invalid credentials' };
    } catch { return { success: false, message: 'Server error. Please try again.' }; }
  },
  register: async (userData) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData)
      }).then(r => r.json());
      if (res.success) { localStorage.setItem('currentUser', JSON.stringify(res.user)); return { success: true, user: res.user }; }
      return { success: false, message: res.message || 'Registration failed' };
    } catch { return { success: false, message: 'Server error.' }; }
  },
  logout: () => { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; },
  isAdmin: () => { const u = Auth.getCurrentUser(); return u && (u.ROLE === 'admin' || u.role === 'admin'); },
};

// ============================================================
// UTILS
// ============================================================
const Utils = {
  formatCurrency: (a) => '₱' + parseFloat(a || 0).toFixed(2),
  formatDate: (d) => new Date(d).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }),
  showToast: (message, type = 'success') => {
    const existing = document.getElementById('toast-notif');
    if (existing) existing.remove();
    const c = { success:{bg:'#dcfce7',border:'#16a34a',text:'#15803d',icon:'✓'}, error:{bg:'#fee2e2',border:'#dc2626',text:'#b91c1c',icon:'✕'}, info:{bg:'#dbeafe',border:'#2563eb',text:'#1d4ed8',icon:'ℹ'} }[type] || {};
    const el = document.createElement('div');
    el.id = 'toast-notif';
    el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};padding:12px 18px;border-radius:10px;font-size:14px;font-weight:500;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:300px;transform:translateY(14px);opacity:0;transition:all .26s ease;`;
    el.innerHTML = `<span style="width:22px;height:22px;border-radius:50%;background:${c.border};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">${c.icon}</span><span>${message}</span>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = 'translateY(0)'; el.style.opacity = '1'; });
    setTimeout(() => { el.style.transform = 'translateY(14px)'; el.style.opacity = '0'; setTimeout(() => el.remove(), 260); }, 2800);
  },
  showNotification: (m) => Utils.showToast(m, 'success'),
  confirm: (m) => window.confirm(m),
  getStatusBadge: (s) => {
    const m = { Pending:'badge-warning', Confirmed:'badge-info', Preparing:'badge-info', Ready:'badge-success', Delivered:'badge-success', Cancelled:'badge-danger' };
    return `<span class="badge ${m[s]||'badge-info'}">${s}</span>`;
  },
};

// ============================================================
// NAV
// ============================================================
const NavInit = {
  init: () => {
    const user = Auth.getCurrentUser();
    const userLink = document.querySelector('a[href="login.html"].nav-link');
    if (!userLink) return;
    if (user) {
      const name = user.FULL_NAME || user.full_name || 'Account';
      userLink.href = '#';
      userLink.innerHTML = `<div style="position:relative;display:flex;align-items:center;gap:6px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span style="font-size:13px;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name.split(' ')[0]}</span>
        <span style="position:absolute;top:-3px;right:-3px;width:8px;height:8px;background:#16a34a;border-radius:50%;border:1.5px solid white;"></span></div>`;
      userLink.addEventListener('click', (e) => {
        e.preventDefault();
        let dd = document.getElementById('user-dd');
        if (dd) { dd.remove(); return; }
        dd = document.createElement('div');
        dd.id = 'user-dd';
        dd.style.cssText = `position:fixed;top:64px;right:16px;z-index:9000;background:white;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.12);min-width:180px;overflow:hidden;`;
        dd.innerHTML = `<div style="padding:12px 16px;background:#fafafa;border-bottom:1px solid #f0f0f0;">
          <p style="font-size:13px;font-weight:600;color:#111;margin-bottom:1px;">${name}</p>
          <p style="font-size:11px;color:#888;">${user.EMAIL||user.email||''}</p></div>
          ${Auth.isAdmin() ? `<a href="admin/dashboard.html" style="display:block;padding:10px 16px;font-size:13px;color:#374151;text-decoration:none;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">⚙ Admin Panel</a>` : ''}
          <a href="orders.html" style="display:block;padding:10px 16px;font-size:13px;color:#374151;text-decoration:none;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">My Orders</a>
          <button onclick="Auth.logout()" style="display:block;width:100%;text-align:left;padding:10px 16px;font-size:13px;color:#dc2626;background:none;border:none;border-top:1px solid #f0f0f0;cursor:pointer;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background=''">Sign Out</button>`;
        document.body.appendChild(dd);
        setTimeout(() => document.addEventListener('click', function h() { dd?.remove(); document.removeEventListener('click', h); }), 50);
      });
    }
  }
};

// ============================================================
// PAGE INITS
// ============================================================
const PageInit = {

  // INDEX
  index: async () => {
    const grid = document.getElementById('featured-products');
    if (!grid) return;
    try {
      const products = await api.getProducts();
      grid.innerHTML = products.filter(p => p.in_stock == 1).slice(0, 4).map(p => productCardHTML(p)).join('');
      setupProductButtons();
    } catch {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;padding:40px;">Could not load products.</p>';
    }
  },

  // MENU
  menu: async () => {
    let selectedCategory = 'All';
    const grid = document.getElementById('products-grid');
    const catFilter = document.getElementById('category-filter');
    if (!grid || !catFilter) return;
    ensureSpinnerStyle();

    const renderCats = async () => {
      try {
        const cats = await api.getCategories();
        catFilter.innerHTML = ['All', ...cats].map(cat =>
          `<button class="category-btn ${cat === selectedCategory ? 'active' : ''}" onclick="selectCategory('${cat}')">${cat}</button>`
        ).join('');
      } catch { catFilter.innerHTML = '<button class="category-btn active">All</button>'; }
    };

    const renderProducts = async () => {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:#aaa;">
        <div style="width:32px;height:32px;border:3px solid #dc2626;border-top-color:transparent;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px;"></div>Loading...</div>`;
      try {
        const products = await api.getProducts(selectedCategory === 'All' ? null : selectedCategory);
        if (!products.length) { grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;padding:60px;">No products in this category.</p>'; return; }
        grid.innerHTML = products.map(p => productCardHTML(p)).join('');
        setupProductButtons();
      } catch { grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;padding:60px;">Failed to load.</p>'; }
    };

    window.selectCategory = (cat) => { selectedCategory = cat; renderCats(); renderProducts(); };
    await renderCats();
    await renderProducts();
  },

  // ── CART — TikTok style: each item has its own Checkout button ──
  cart: () => {
    const render = () => {
      const items = Cart.getItems();
      const emptyEl   = document.getElementById('empty-cart');
      const contentEl = document.getElementById('cart-content');
      const itemsEl   = document.getElementById('cart-items');

      if (items.length === 0) {
        emptyEl?.classList.remove('hidden');
        contentEl?.classList.add('hidden');
        return;
      }
      emptyEl?.classList.add('hidden');
      contentEl?.classList.remove('hidden');

      if (itemsEl) {
        itemsEl.innerHTML = items.map(item => `
          <div class="cart-item" id="cart-item-${item.id}" style="transition:opacity .25s;">
            <img src="${item.image || 'https://via.placeholder.com/96'}" class="cart-item-image"
              onerror="this.src='https://via.placeholder.com/96'" />
            <div class="cart-item-details" style="flex:1;">
              <h3 class="cart-item-title">${item.name}</h3>
              <p class="cart-item-category">${item.category || ''}</p>
              <p style="font-size:14px;color:var(--primary-red);font-weight:600;margin-top:4px;">
                ${Utils.formatCurrency(item.price)} each</p>
              <div class="quantity-controls" style="margin-top:10px;">
                <button class="quantity-btn" onclick="cartChangeQty(${item.id}, -1)" title="${item.quantity === 1 ? 'Remove item' : 'Decrease'}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn" onclick="cartChangeQty(${item.id}, 1)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:12px;">
              <p style="font-size:1.125rem;font-weight:700;color:var(--gray-900);">
                ${Utils.formatCurrency(item.price * item.quantity)}</p>
              <!-- ── Per-item Checkout button ── -->
              <button
                onclick='openCheckoutSheet(${JSON.stringify(item).replace(/'/g, "&#39;")})'
                style="
                  padding:9px 16px;
                  background:linear-gradient(135deg,#dc2626,#f97316);
                  color:white;border:none;border-radius:10px;
                  font-size:13px;font-weight:700;cursor:pointer;
                  white-space:nowrap;
                ">
                Checkout
              </button>
            </div>
          </div>`).join('');
      }

      // Update footer totals
      const subtotal = Cart.getTotalPrice();
      const count    = Cart.getTotalItems();
      const totalEl  = document.getElementById('cart-total-display');
      const countEl  = document.getElementById('cart-item-count');
      if (totalEl) totalEl.textContent = Utils.formatCurrency(subtotal);
      if (countEl) countEl.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    };

    window.cartChangeQty = (id, delta) => {
      const items = Cart.getItems();
      const item  = items.find(i => i.id === id);
      if (item && item.quantity === 1 && delta === -1) {
        const row = document.getElementById(`cart-item-${id}`);
        if (row) { row.style.opacity = '0'; setTimeout(() => { Cart.updateQuantity(id, -1); render(); }, 240); }
        return;
      }
      Cart.updateQuantity(id, delta);
      render();
    };

    render();
  },

  // CHECKOUT — kept for Buy Now flow from menu/product pages
  checkout: () => {
    if (!Auth.isLoggedIn()) {
      sessionStorage.setItem('redirectAfterLogin', 'checkout.html');
      window.location.href = 'login.html'; return;
    }

    const buyNow = JSON.parse(sessionStorage.getItem('buyNowItem') || 'null');
    const items = buyNow ? [{ ...buyNow, quantity: buyNow.quantity || 1 }] : Cart.getItems();

    if (!items.length) {
      Utils.showToast('Your cart is empty!', 'info');
      setTimeout(() => window.location.href = 'menu.html', 1500); return;
    }

    if (buyNow) {
      const notice = document.getElementById('buynow-notice');
      if (notice) {
        notice.innerHTML = `<div class="alert alert-info" style="margin-bottom:16px;">
          <strong>Buy Now:</strong> Ordering <em>"${buyNow.name}"</em> directly.
          <a href="cart.html" style="color:#1d4ed8;margin-left:8px;">← Go to cart</a></div>`;
        notice.style.display = 'block';
      }
    }

    const user = Auth.getCurrentUser();
    const form = document.getElementById('checkout-form');
    if (user && form) {
      const f = (n, v) => { const el = form.querySelector(`[name="${n}"]`); if (el) el.value = v || ''; };
      f('fullName', user.FULL_NAME || user.full_name);
      f('email',    user.EMAIL    || user.email);
      f('phone',    user.PHONE    || user.phone);
    }

    let selectedOrderType = 'Delivery';

    const renderSummary = () => {
      const deliveryFee = selectedOrderType === 'Pick-up' ? 0 : 50;
      const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
      const el = document.getElementById('checkout-items');
      if (el) {
        el.innerHTML = items.map(i => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;">
            <div style="flex:1;min-width:0;margin-right:12px;">
              <p style="font-weight:500;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${i.name}</p>
              <p style="color:#888;margin-top:2px;">x${i.quantity} @ ₱${parseFloat(i.price).toFixed(2)}</p>
            </div>
            <span style="font-weight:600;color:#111;flex-shrink:0;">₱${(i.price * i.quantity).toFixed(2)}</span>
          </div>`).join('');
      }
      const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
      set('checkout-subtotal', `₱${subtotal.toFixed(2)}`);
      set('checkout-delivery', deliveryFee === 0 ? 'FREE' : '₱50.00');
      set('checkout-total',    `₱${(subtotal + deliveryFee).toFixed(2)}`);
    };

    document.querySelectorAll('.order-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedOrderType = btn.dataset.type;
        const addrFields = document.getElementById('address-fields');
        if (addrFields) addrFields.style.display = selectedOrderType === 'Delivery' ? 'block' : 'none';
        renderSummary();
      });
    });

    renderSummary();

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>Placing Order...';
      btn.disabled = true;
      const data = new FormData(form);
      const deliveryFee = selectedOrderType === 'Pick-up' ? 0 : 50;
      const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
      const orderData = {
        user_id: user ? (user.USER_ID || user.user_id) : null,
        full_name: data.get('fullName'), phone: data.get('phone'), email: data.get('email'),
        order_type: selectedOrderType,
        address: selectedOrderType === 'Delivery' ? data.get('address') : null,
        city: selectedOrderType === 'Delivery' ? data.get('city') : null,
        payment_method: data.get('paymentMethod'), notes: data.get('notes'),
        subtotal, delivery_fee: deliveryFee, total: subtotal + deliveryFee,
        items: items.map(i => ({ product_id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      };
      try {
        const result = await api.placeOrder(orderData);
        if (result.success) {
          if (!buyNow) Cart.clearCart();
          sessionStorage.removeItem('buyNowItem');
          sessionStorage.setItem('lastOrder', JSON.stringify({ ...orderData, order_id: result.order_id }));
          window.location.href = 'confirmation.html';
        } else {
          Utils.showToast(result.message || 'Failed to place order', 'error');
          btn.innerHTML = '<i class="fas fa-check" style="margin-right:8px;"></i>Place Order'; btn.disabled = false;
        }
      } catch {
        Utils.showToast('Server error. Please try again.', 'error');
        btn.innerHTML = '<i class="fas fa-check" style="margin-right:8px;"></i>Place Order'; btn.disabled = false;
      }
    });
  },

  // CONFIRMATION
  confirmation: () => {
    const order = JSON.parse(sessionStorage.getItem('lastOrder') || 'null');
    if (!order) { document.querySelector('main').innerHTML = `<div style="text-align:center;padding:80px 20px;"><p style="color:#888;margin-bottom:20px;">No order found.</p><a href="menu.html" class="btn btn-primary">Go to Menu</a></div>`; return; }
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('order-number', `ORD-${String(order.order_id).padStart(4,'0')}`);
    set('customer-name', order.full_name); set('customer-phone', order.phone);
    set('customer-email', order.email); set('order-type', order.order_type);
    set('payment-method', order.payment_method); set('order-total', Utils.formatCurrency(order.total));
    const addrRow = document.getElementById('address-row');
    if (order.order_type === 'Pick-up') { if (addrRow) addrRow.style.display = 'none'; }
    else { const el = document.getElementById('delivery-address'); if (el) el.textContent = `${order.address||''}, ${order.city||''}`; }
    const itemsEl = document.getElementById('confirmation-items');
    if (itemsEl && order.items) {
      itemsEl.innerHTML = order.items.map(i => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;">
          <span>${i.name} <span style="color:#888;">x${i.quantity}</span></span>
          <span style="font-weight:600;">₱${(i.price*i.quantity).toFixed(2)}</span>
        </div>`).join('');
    }
  },

  // ORDERS
  orders: async () => {
    if (!Auth.isLoggedIn()) { sessionStorage.setItem('redirectAfterLogin','orders.html'); window.location.href='login.html'; return; }
    const user = Auth.getCurrentUser();
    const container = document.getElementById('orders-list');
    if (!container) return;
    ensureSpinnerStyle();
    container.innerHTML = `<div style="text-align:center;padding:60px;color:#aaa;"><div style="width:32px;height:32px;border:3px solid #dc2626;border-top-color:transparent;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px;"></div>Loading your orders...</div>`;
    try {
      const orders = await api.getMyOrders(user.USER_ID || user.user_id);
      if (!orders?.length) {
        container.innerHTML = `<div style="text-align:center;padding:80px 20px;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" style="margin:0 auto 16px;"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
          <h2 style="font-size:20px;margin-bottom:8px;">No orders yet</h2>
          <p style="color:#888;margin-bottom:24px;">Start ordering to see your history here.</p>
          <a href="menu.html" class="btn btn-primary">Browse Menu</a></div>`;
        return;
      }
      container.innerHTML = orders.map(order => {
        const id = order.ORDER_ID||order.order_id;
        const status = order.STATUS||order.status;
        const items = order.items||[];
        return `<div class="card" style="margin-bottom:20px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#dc2626,#f97316);padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
            <div><p style="color:rgba(255,255,255,.8);font-size:12px;margin-bottom:2px;">Order Number</p>
              <p style="color:white;font-weight:700;font-size:16px;">ORD-${String(id).padStart(4,'0')}</p></div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
              ${Utils.getStatusBadge(status)}
              <span style="color:rgba(255,255,255,.8);font-size:11px;">${Utils.formatDate(order.CREATED_AT||order.created_at)}</span></div>
          </div>
          <div class="card-content">
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:14px;">
              <div><p style="font-size:12px;color:#888;margin-bottom:2px;">Order Type</p><p style="font-size:14px;font-weight:500;">${order.ORDER_TYPE||order.order_type}</p></div>
              <div><p style="font-size:12px;color:#888;margin-bottom:2px;">Payment</p><p style="font-size:14px;font-weight:500;">${order.PAYMENT_METHOD||order.payment_method}</p></div>
            </div>
            ${items.length ? `<div style="border-top:1px solid #f3f4f6;padding-top:12px;margin-bottom:12px;">
              <p style="font-size:12px;color:#888;margin-bottom:8px;">Items</p>
              ${items.map(i=>`<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;">
                <span>${i.NAME||i.name} <span style="color:#888;">x${i.QUANTITY||i.quantity}</span></span>
                <span>₱${((i.PRICE||i.price)*(i.QUANTITY||i.quantity)).toFixed(2)}</span></div>`).join('')}</div>` : ''}
            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f3f4f6;padding-top:12px;">
              <span style="font-size:13px;color:#888;">Total Amount</span>
              <span style="font-size:18px;font-weight:700;color:#dc2626;">₱${parseFloat(order.TOTAL||order.total||0).toFixed(2)}</span>
            </div>
          </div></div>`;
      }).join('');
    } catch { container.innerHTML = `<div style="text-align:center;padding:40px;color:#888;"><p>Failed to load orders.</p><button onclick="PageInit.orders()" class="btn btn-primary" style="margin-top:16px;">Retry</button></div>`; }
  },

  // LOGIN
  login: () => {
    if (Auth.isLoggedIn()) {
      const redirect = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
      sessionStorage.removeItem('redirectAfterLogin');
      window.location.href = Auth.isAdmin() ? 'admin/dashboard.html' : redirect; return;
    }
    let isLogin = true;
    window.toggleMode = () => {
      isLogin = !isLogin;
      document.getElementById('login-form').classList.toggle('hidden', !isLogin);
      document.getElementById('register-form').classList.toggle('hidden', isLogin);
      document.getElementById('page-title').textContent = isLogin ? 'Welcome Back' : 'Create Account';
      document.getElementById('page-subtitle').textContent = isLogin ? 'Sign in to your account' : 'Join us today';
      document.getElementById('toggle-text').textContent = isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In';
    };
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type=submit]');
      btn.textContent = 'Signing in...'; btn.disabled = true;
      const d = new FormData(e.target);
      const result = await Auth.login(d.get('email'), d.get('password'));
      if (result.success) {
        Utils.showToast('Login successful!', 'success');
        const redirect = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
        sessionStorage.removeItem('redirectAfterLogin');
        setTimeout(() => window.location.href = Auth.isAdmin() ? 'admin/dashboard.html' : redirect, 700);
      } else { Utils.showToast(result.message||'Login failed','error'); btn.textContent='Sign In'; btn.disabled=false; }
    });
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type=submit]');
      btn.textContent = 'Creating...'; btn.disabled = true;
      const d = new FormData(e.target);
      const result = await Auth.register({ full_name:d.get('fullName'), email:d.get('email'), phone:d.get('phone'), password:d.get('password') });
      if (result.success) { Utils.showToast('Account created!','success'); setTimeout(()=>window.location.href='index.html',700); }
      else { Utils.showToast(result.message||'Registration failed','error'); btn.textContent='Create Account'; btn.disabled=false; }
    });
  },

  contact: () => {
    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
      e.preventDefault(); Utils.showToast("Message sent! We'll get back to you soon.",'success'); e.target.reset();
    });
  },
};

// ============================================================
// PRODUCT CARD HTML
// ============================================================
function productCardHTML(p) {
  const available = p.in_stock == 1;
  const pJson = JSON.stringify(p).replace(/"/g, '&quot;');
  return `
    <div class="card product-card">
      ${!available ? `<div class="product-overlay"><span class="product-badge badge-unavailable">Unavailable</span></div>` : ''}
      <img src="${p.image||'https://via.placeholder.com/400'}" alt="${p.name}" class="card-image"
        onerror="this.src='https://via.placeholder.com/400'"/>
      <div class="card-content">
        <h3 class="card-title">${p.name}</h3>
        <p class="card-description">${p.description||''}</p>
        <div class="flex items-center justify-between mb-3">
          <span class="card-price">${Utils.formatCurrency(p.price)}</span>
          <span class="badge ${available?'badge-success':'badge-danger'}">${available?'Available':'Unavailable'}</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm add-to-cart-btn" style="flex:1;background:#f3f4f6;color:#374151;border:1.5px solid #e5e7eb;font-weight:600;transition:all .2s;"
            data-product="${pJson}" ${!available?'disabled':''}
            onmouseover="if(!this.disabled)this.style.cssText='flex:1;background:#e5e7eb;color:#111;border:1.5px solid #d1d5db;font-weight:600;transition:all .2s;'"
            onmouseout="if(!this.disabled)this.style.cssText='flex:1;background:#f3f4f6;color:#374151;border:1.5px solid #e5e7eb;font-weight:600;transition:all .2s;'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Cart
          </button>
          <button class="btn btn-primary btn-sm buy-now-btn" style="flex:1.3;"
            data-product="${pJson}" ${!available?'disabled':''}>
            Buy Now
          </button>
        </div>
      </div>
    </div>`;
}

function setupProductButtons() {
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = JSON.parse(btn.dataset.product);
      Cart.addItem({ id:p.id, name:p.name, price:p.price, image:p.image, category:p.category });
      document.querySelectorAll('.cart-badge').forEach(b => {
        b.style.transform = 'scale(1.5)';
        setTimeout(() => b.style.transform = 'scale(1)', 200);
      });
      Utils.showToast(`Added to cart!`, 'success');
    });
  });

  document.querySelectorAll('.buy-now-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = JSON.parse(btn.dataset.product);
      sessionStorage.setItem('buyNowItem', JSON.stringify({ id:p.id, name:p.name, price:p.price, image:p.image, category:p.category, quantity:1 }));
      if (!Auth.isLoggedIn()) { sessionStorage.setItem('redirectAfterLogin','checkout.html'); window.location.href='login.html'; return; }
      window.location.href = 'checkout.html';
    });
  });
}

function ensureSpinnerStyle() {
  if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();
  NavInit.init();
  const page = window.location.pathname.split('/').pop().replace('.html','') || 'index';
  if (PageInit[page]) PageInit[page]();
});