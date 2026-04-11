// ============================================================
// BASE PATH HELPER
// ============================================================
function getBase() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  const idx = parts.indexOf('frontend');
  if (idx !== -1) return window.location.origin + '/' + parts.slice(0, idx + 1).join('/') + '/';
  const dir = parts.slice(0, -1);
  if (dir[dir.length - 1] === 'admin') dir.pop();
  return window.location.origin + '/' + dir.join('/') + '/';
}
function goTo(page) { window.location.href = getBase() + page; }

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
  logout: () => { localStorage.removeItem('currentUser'); goTo('index.html'); },
  isAdmin: () => { const u = Auth.getCurrentUser(); return u && (u.ROLE === 'admin' || u.role === 'admin'); },
};

// ============================================================
// UTILS
// ============================================================
const Utils = {
  formatCurrency: (a) => '₱' + parseFloat(a || 0).toFixed(2),
  formatDate: (d) => new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
  showToast: (message, type = 'success') => {
    const existing = document.getElementById('toast-notif');
    if (existing) existing.remove();
    const c = {
      success: { bg: '#dcfce7', border: '#16a34a', text: '#15803d', icon: '✓' },
      error:   { bg: '#fee2e2', border: '#dc2626', text: '#b91c1c', icon: '✕' },
      info:    { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8', icon: 'ℹ' }
    }[type] || {};
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
    const m = { Pending: 'badge-warning', Confirmed: 'badge-info', Preparing: 'badge-info', Ready: 'badge-success', Delivered: 'badge-success', Cancelled: 'badge-danger' };
    return `<span class="badge ${m[s] || 'badge-info'}">${s}</span>`;
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
      const name = user.full_name || user.FULL_NAME || 'Account';
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
          <p style="font-size:11px;color:#888;">${user.email || user.EMAIL || ''}</p></div>
          ${Auth.isAdmin() ? `<a href="javascript:void(0)" onclick="goTo('admin/dashboard.html')" style="display:block;padding:10px 16px;font-size:13px;color:#374151;text-decoration:none;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">⚙ Admin Panel</a>` : ''}
          <a href="javascript:void(0)" onclick="goTo('orders.html')" style="display:block;padding:10px 16px;font-size:13px;color:#374151;text-decoration:none;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">My Orders</a>
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

  // CART
  cart: () => {
    const render = () => {
      const items = Cart.getItems();
      const emptyEl   = document.getElementById('empty-cart');
      const contentEl = document.getElementById('cart-content');
      const itemsEl   = document.getElementById('cart-items');
      if (items.length === 0) { emptyEl?.classList.remove('hidden'); contentEl?.classList.add('hidden'); return; }
      emptyEl?.classList.add('hidden'); contentEl?.classList.remove('hidden');
      if (itemsEl) {
        itemsEl.innerHTML = items.map(item => `
          <div class="cart-item" id="cart-item-${item.id}" style="transition:opacity .25s,transform .25s;position:relative;border-radius:16px;background:white;box-shadow:0 2px 12px rgba(0,0,0,0.07);padding:16px;display:flex;align-items:flex-start;gap:14px;">
            <button onclick="cartRemove(${item.id})" title="Remove" style="position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:50%;background:#f3f4f6;border:1px solid #e5e7eb;color:#9ca3af;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .15s;z-index:1;"
              onmouseover="this.style.background='#fee2e2';this.style.color='#dc2626';this.style.borderColor='#fca5a5';"
              onmouseout="this.style.background='#f3f4f6';this.style.color='#9ca3af';this.style.borderColor='#e5e7eb';">✕</button>
            <img src="${item.image || 'https://via.placeholder.com/88'}" onerror="this.src='https://via.placeholder.com/88'" style="width:88px;height:88px;object-fit:cover;border-radius:12px;flex-shrink:0;background:#f3f4f6;" />
            <div style="flex:1;min-width:0;padding-right:32px;">
              <p style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">${item.category || ''}</p>
              <h3 style="font-size:15px;font-weight:700;color:#111;margin:0 0 2px;">${item.name}</h3>
              <p style="font-size:14px;color:#dc2626;font-weight:600;margin:0 0 10px;">₱${parseFloat(item.price).toFixed(2)} each</p>
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                <div style="display:flex;align-items:center;border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                  <button onclick="cartChangeQty(${item.id}, -1)" style="width:36px;height:36px;background:#f9fafb;border:none;font-size:18px;cursor:pointer;color:#374151;display:flex;align-items:center;justify-content:center;">−</button>
                  <span style="min-width:32px;text-align:center;font-weight:700;font-size:15px;color:#111;">${item.quantity}</span>
                  <button onclick="cartChangeQty(${item.id}, 1)" style="width:36px;height:36px;background:#f9fafb;border:none;font-size:18px;cursor:pointer;color:#374151;display:flex;align-items:center;justify-content:center;">+</button>
                </div>
                <span style="font-size:16px;font-weight:800;color:#111;">₱${(item.price * item.quantity).toFixed(2)}</span>
                <button onclick='cartOrderItem(${JSON.stringify(item).replace(/'/g, "&#39;")})' style="padding:9px 20px;background:linear-gradient(135deg,#dc2626,#f97316);color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;">Order</button>
              </div>
            </div>
          </div>`).join('');
      }
    };
    window.cartChangeQty = (id, delta) => {
      const item = Cart.getItems().find(i => i.id === id);
      if (item && item.quantity === 1 && delta === -1) {
        const row = document.getElementById(`cart-item-${id}`);
        if (row) { row.style.opacity = '0'; row.style.transform = 'translateX(16px)'; setTimeout(() => { Cart.updateQuantity(id, -1); render(); }, 240); }
        return;
      }
      Cart.updateQuantity(id, delta); render();
    };
    window.cartRemove = (id) => {
      const row = document.getElementById(`cart-item-${id}`);
      if (row) { row.style.opacity = '0'; row.style.transform = 'translateX(20px)'; setTimeout(() => { Cart.removeItem(id); render(); }, 230); }
      else { Cart.removeItem(id); render(); }
    };
    window.cartOrderItem = (item) => {
      if (!Auth.isLoggedIn()) { sessionStorage.setItem('redirectAfterLogin', 'checkout.html'); sessionStorage.setItem('buyNowItem', JSON.stringify({ ...item, quantity: item.quantity || 1 })); goTo('login.html'); return; }
      sessionStorage.setItem('buyNowItem', JSON.stringify({ ...item, quantity: item.quantity || 1 }));
      goTo('checkout.html');
    };
    render();
  },

  // CHECKOUT
  checkout: () => {
    if (!Auth.isLoggedIn()) { sessionStorage.setItem('redirectAfterLogin', 'checkout.html'); goTo('login.html'); return; }
    const buyNow = JSON.parse(sessionStorage.getItem('buyNowItem') || 'null');
    const items = buyNow ? [{ ...buyNow, quantity: buyNow.quantity || 1 }] : Cart.getItems();
    if (!items.length) { Utils.showToast('Your cart is empty!', 'info'); setTimeout(() => goTo('menu.html'), 1500); return; }
    if (buyNow) {
      const notice = document.getElementById('buynow-notice');
      if (notice) { notice.innerHTML = `<div class="alert alert-info" style="margin-bottom:16px;"><strong>Ordering:</strong> <em>"${buyNow.name}"</em> <a href="javascript:void(0)" onclick="goTo('cart.html')" style="color:#1d4ed8;margin-left:8px;">← Back to cart</a></div>`; notice.style.display = 'block'; }
    }
    const user = Auth.getCurrentUser();
    const form = document.getElementById('checkout-form');
    if (user && form) {
      const f = (n, v) => { const el = form.querySelector(`[name="${n}"]`); if (el) el.value = v || ''; };
      f('fullName', user.full_name || user.FULL_NAME);
      f('email',    user.email    || user.EMAIL);
      f('phone',    user.phone    || user.PHONE);
    }
    let selectedOrderType = 'Delivery';
    const renderSummary = () => {
      const deliveryFee = selectedOrderType === 'Pick-up' ? 0 : 50;
      const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
      const el = document.getElementById('checkout-items');
      if (el) el.innerHTML = items.map(i => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;">
          <div style="flex:1;min-width:0;margin-right:12px;">
            <p style="font-weight:500;color:#111;">${i.name}</p>
            <p style="color:#888;margin-top:2px;">x${i.quantity} @ ₱${parseFloat(i.price).toFixed(2)}</p>
          </div>
          <span style="font-weight:600;color:#111;flex-shrink:0;">₱${(i.price * i.quantity).toFixed(2)}</span>
        </div>`).join('');
      const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
      set('checkout-subtotal', `₱${subtotal.toFixed(2)}`);
      set('checkout-delivery', deliveryFee === 0 ? 'FREE' : '₱50.00');
      set('checkout-total',    `₱${(subtotal + deliveryFee).toFixed(2)}`);
    };
    document.querySelectorAll('.order-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); selectedOrderType = btn.dataset.type;
        const addrFields = document.getElementById('address-fields');
        if (addrFields) addrFields.style.display = selectedOrderType === 'Delivery' ? 'block' : 'none';
        renderSummary();
      });
    });
    renderSummary();
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>Placing Order...'; btn.disabled = true;
      const data = new FormData(form);
      const deliveryFee = selectedOrderType === 'Pick-up' ? 0 : 50;
      const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
      const orderData = {
        user_id: user ? (user.user_id || user.USER_ID) : null,
        full_name: data.get('fullName'), phone: data.get('phone'), email: data.get('email'),
        order_type: selectedOrderType,
        address: selectedOrderType === 'Delivery' ? data.get('address') : null,
        city:    selectedOrderType === 'Delivery' ? data.get('city')    : null,
        payment_method: data.get('paymentMethod'), notes: data.get('notes'),
        subtotal, delivery_fee: deliveryFee, total: subtotal + deliveryFee,
        items: items.map(i => ({ product_id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      };
      try {
        const result = await api.placeOrder(orderData);
        if (result.success) {
          if (!buyNow) Cart.clearCart(); else Cart.removeItem(buyNow.id);
          sessionStorage.removeItem('buyNowItem');
          const lastOrderData = JSON.stringify({ ...orderData, order_id: result.order_id });
          sessionStorage.setItem('lastOrder', lastOrderData);
          localStorage.setItem('lastOrder', lastOrderData);
          goTo('confirmation.html');
        } else { Utils.showToast(result.message || 'Failed to place order', 'error'); btn.innerHTML = 'Place Order'; btn.disabled = false; }
      } catch { Utils.showToast('Server error. Please try again.', 'error'); btn.innerHTML = 'Place Order'; btn.disabled = false; }
    });
  },

  // CONFIRMATION
  confirmation: () => {
    const raw = sessionStorage.getItem('lastOrder') || localStorage.getItem('lastOrder') || 'null';
    const order = JSON.parse(raw);
    localStorage.removeItem('lastOrder');
    if (!order) {
      document.querySelector('main').innerHTML = `<div style="text-align:center;padding:80px 20px;">
        <i class="fas fa-exclamation-circle" style="font-size:48px;color:#dc2626;margin-bottom:16px;display:block;"></i>
        <h2 style="margin-bottom:8px;">Order not found</h2><p style="color:#888;margin-bottom:20px;">Check My Orders to confirm.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <a href="javascript:void(0)" onclick="goTo('orders.html')" class="btn btn-primary">View My Orders</a>
          <a href="javascript:void(0)" onclick="goTo('menu.html')" class="btn btn-outline">Back to Menu</a>
        </div></div>`;
      return;
    }
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('order-number',   `ORD-${String(order.order_id).padStart(4, '0')}`);
    set('customer-name',  order.full_name);
    set('customer-phone', order.phone);
    set('customer-email', order.email);
    set('order-type',     order.order_type);
    set('payment-method', order.payment_method);
    set('order-total',    Utils.formatCurrency(order.total));
    const addrRow = document.getElementById('address-row');
    if (order.order_type === 'Pick-up') { if (addrRow) addrRow.style.display = 'none'; }
    else { const el = document.getElementById('delivery-address'); if (el) el.textContent = `${order.address || ''}, ${order.city || ''}`; }
    const itemsEl = document.getElementById('confirmation-items');
    if (itemsEl && order.items) {
      itemsEl.innerHTML = order.items.map(i => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;">
          <span>${i.name} <span style="color:#888;">x${i.quantity}</span></span>
          <span style="font-weight:600;">₱${(i.price * i.quantity).toFixed(2)}</span>
        </div>`).join('');
    }
  },

  // ============================================================
  // ORDERS — fixed: all lowercase keys from Oracle
  // ============================================================
  orders: async () => {
    if (!Auth.isLoggedIn()) { sessionStorage.setItem('redirectAfterLogin', 'orders.html'); goTo('login.html'); return; }
    const user = Auth.getCurrentUser();
    const container = document.getElementById('orders-list');
    if (!container) return;
    ensureSpinnerStyle();

    container.innerHTML = `<div style="text-align:center;padding:60px;color:#aaa;">
      <div style="width:32px;height:32px;border:3px solid #dc2626;border-top-color:transparent;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px;"></div>
      Loading your orders...</div>`;

    try {
      const userId = user.user_id || user.USER_ID;
      const orders = await api.getMyOrders(userId);

      if (!orders || orders.length === 0) {
        container.innerHTML = `
          <div style="text-align:center;padding:80px 20px;">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" stroke-width="1.2" style="margin:0 auto 20px;display:block;">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
            </svg>
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#111;">No orders yet</h2>
            <p style="color:#9ca3af;margin-bottom:24px;">Start ordering to see your history here.</p>
            <a href="javascript:void(0)" onclick="goTo('menu.html')" class="btn btn-primary">Browse Menu</a>
          </div>`;
        return;
      }

      // Status badge styles (inline — no dependency on CSS classes)
      const statusStyle = {
        Pending:   'background:#fef3c7;color:#92400e;border:1px solid #fde68a;',
        Confirmed: 'background:#dbeafe;color:#1e40af;border:1px solid #bfdbfe;',
        Preparing: 'background:#ede9fe;color:#5b21b6;border:1px solid #ddd6fe;',
        Ready:     'background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;',
        Delivered: 'background:#dcfce7;color:#14532d;border:1px solid #86efac;',
        Cancelled: 'background:#fee2e2;color:#7f1d1d;border:1px solid #fca5a5;',
      };

      container.innerHTML = orders.map((order, idx) => {
        // ✅ All lowercase — matches our fixed orders.js backend aliases
        const id        = order.order_id;
        const status    = order.status    || 'Pending';
        const orderType = order.order_type     || '—';
        const payment   = order.payment_method || '—';
        const total     = parseFloat(order.total || 0);
        const createdAt = order.created_at;
        const items     = order.items || [];
        const badge     = statusStyle[status] || statusStyle['Pending'];

        return `
          <div style="border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);
            margin-bottom:20px;background:white;animation:fadeInUp .3s ease ${idx * 0.06}s both;">

            <!-- Header -->
            <div style="background:linear-gradient(135deg,#dc2626,#f97316);padding:16px 20px;
              display:flex;justify-content:space-between;align-items:center;">
              <div>
                <p style="color:rgba(255,255,255,.75);font-size:11px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em;">Order Number</p>
                <p style="color:white;font-weight:700;font-size:18px;">ORD-${String(id).padStart(4, '0')}</p>
              </div>
              <div style="text-align:right;">
                <span style="display:inline-block;padding:5px 14px;border-radius:999px;font-size:12px;font-weight:700;${badge}">${status}</span>
                <p style="color:rgba(255,255,255,.75);font-size:11px;margin-top:6px;">${createdAt ? Utils.formatDate(createdAt) : ''}</p>
              </div>
            </div>

            <!-- Body -->
            <div style="padding:18px 20px;">
              <!-- Meta -->
              <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px;">
                <div>
                  <p style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Order Type</p>
                  <p style="font-size:14px;font-weight:600;color:#111;">${orderType}</p>
                </div>
                <div>
                  <p style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Payment</p>
                  <p style="font-size:14px;font-weight:600;color:#111;">${payment}</p>
                </div>
                ${order.address ? `
                <div style="grid-column:span 2;">
                  <p style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Delivery Address</p>
                  <p style="font-size:14px;font-weight:600;color:#111;">${order.address}, ${order.city || 'Naga City'}</p>
                </div>` : ''}
              </div>

              <!-- Items -->
              ${items.length ? `
              <div style="border-top:1px solid #f3f4f6;padding-top:14px;margin-bottom:14px;">
                <p style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px;">Items Ordered</p>
                ${items.map(i => `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px;border-bottom:1px solid #fafafa;">
                    <span style="color:#374151;font-weight:500;">${i.name}
                      <span style="color:#9ca3af;font-weight:400;">× ${i.quantity}</span>
                    </span>
                    <span style="font-weight:600;color:#111;">₱${(parseFloat(i.price) * i.quantity).toFixed(2)}</span>
                  </div>`).join('')}
              </div>` : ''}

              <!-- Total -->
              <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f3f4f6;padding-top:14px;">
                <span style="font-size:13px;color:#6b7280;font-weight:500;">Total Amount</span>
                <span style="font-size:20px;font-weight:800;color:#dc2626;">₱${total.toFixed(2)}</span>
              </div>
            </div>
          </div>`;
      }).join('');

    } catch (err) {
      console.error('Orders error:', err);
      container.innerHTML = `
        <div style="text-align:center;padding:48px;color:#888;">
          <i class="fas fa-exclamation-circle" style="font-size:40px;color:#fca5a5;margin-bottom:12px;display:block;"></i>
          <p style="margin-bottom:16px;">Could not load your orders.</p>
          <button onclick="PageInit.orders()" class="btn btn-primary">Try Again</button>
        </div>`;
    }
  },

  // LOGIN
  login: () => {
    if (Auth.isLoggedIn()) {
      const redirect = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
      sessionStorage.removeItem('redirectAfterLogin');
      goTo(Auth.isAdmin() ? 'admin/dashboard.html' : redirect); return;
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
        setTimeout(() => goTo(Auth.isAdmin() ? 'admin/dashboard.html' : redirect), 700);
      } else { Utils.showToast(result.message || 'Login failed', 'error'); btn.textContent = 'Sign In'; btn.disabled = false; }
    });
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type=submit]');
      btn.textContent = 'Creating...'; btn.disabled = true;
      const d = new FormData(e.target);
      const result = await Auth.register({ full_name: d.get('fullName'), email: d.get('email'), phone: d.get('phone'), password: d.get('password') });
      if (result.success) { Utils.showToast('Account created!', 'success'); setTimeout(() => goTo('index.html'), 700); }
      else { Utils.showToast(result.message || 'Registration failed', 'error'); btn.textContent = 'Create Account'; btn.disabled = false; }
    });
  },

  contact: () => {
    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
      e.preventDefault(); Utils.showToast("Message sent! We'll get back to you soon.", 'success'); e.target.reset();
    });
  },
};

// ============================================================
// PRODUCT CARD
// ============================================================
function productCardHTML(p) {
  const available = p.in_stock == 1;
  const pJson = JSON.stringify(p).replace(/"/g, '&quot;');
  return `
    <div class="card product-card">
      ${!available ? `<div class="product-overlay"><span class="product-badge badge-unavailable">Unavailable</span></div>` : ''}
      <img src="${p.image || 'https://via.placeholder.com/400'}" alt="${p.name}" class="card-image" onerror="this.src='https://via.placeholder.com/400'"/>
      <div class="card-content">
        <h3 class="card-title">${p.name}</h3>
        <p class="card-description">${p.description || ''}</p>
        <div class="flex items-center justify-between mb-3">
          <span class="card-price">${Utils.formatCurrency(p.price)}</span>
          <span class="badge ${available ? 'badge-success' : 'badge-danger'}">${available ? 'Available' : 'Unavailable'}</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm add-to-cart-btn"
            style="flex:1;background:#f3f4f6;color:#374151;border:1.5px solid #e5e7eb;font-weight:600;transition:all .2s;"
            data-product="${pJson}" ${!available ? 'disabled' : ''}
            onmouseover="if(!this.disabled)this.style.cssText='flex:1;background:#e5e7eb;color:#111;border:1.5px solid #d1d5db;font-weight:600;transition:all .2s;'"
            onmouseout="if(!this.disabled)this.style.cssText='flex:1;background:#f3f4f6;color:#374151;border:1.5px solid #e5e7eb;font-weight:600;transition:all .2s;'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>Cart
          </button>
          <button class="btn btn-primary btn-sm buy-now-btn" style="flex:1.3;" data-product="${pJson}" ${!available ? 'disabled' : ''}>Buy Now</button>
        </div>
      </div>
    </div>`;
}

function setupProductButtons() {
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = JSON.parse(btn.dataset.product);
      Cart.addItem({ id: p.id, name: p.name, price: p.price, image: p.image, category: p.category });
      document.querySelectorAll('.cart-badge').forEach(b => { b.style.transform = 'scale(1.5)'; setTimeout(() => b.style.transform = 'scale(1)', 200); });
      Utils.showToast('Added to cart!', 'success');
    });
  });
  document.querySelectorAll('.buy-now-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = JSON.parse(btn.dataset.product);
      sessionStorage.setItem('buyNowItem', JSON.stringify({ id: p.id, name: p.name, price: p.price, image: p.image, category: p.category, quantity: 1 }));
      if (!Auth.isLoggedIn()) { sessionStorage.setItem('redirectAfterLogin', 'checkout.html'); goTo('login.html'); return; }
      goTo('checkout.html');
    });
  });
}

function ensureSpinnerStyle() {
  if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    `;
    document.head.appendChild(s);
  }
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();
  NavInit.init();
  const page = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
  if (PageInit[page]) PageInit[page]();
});