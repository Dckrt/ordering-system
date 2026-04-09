// ============================================================
// CART MANAGEMENT
// ============================================================
const Cart = {
  getItems: () => JSON.parse(localStorage.getItem('cart') || '[]'),
  getCart: () => JSON.parse(localStorage.getItem('cart') || '[]'),

  saveCart: (cart) => localStorage.setItem('cart', JSON.stringify(cart)),

  addItem: (product) => {
    const cart = Cart.getCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, category: product.category, quantity: 1 });
    }
    Cart.saveCart(cart);
    Cart.updateBadge();
    return cart;
  },

  removeItem: (productId) => {
    const cart = Cart.getCart().filter(i => i.id !== productId);
    Cart.saveCart(cart);
    Cart.updateBadge();
    return cart;
  },

  updateQuantity: (productId, delta) => {
    const cart = Cart.getCart();
    const item = cart.find(i => i.id === productId);
    if (!item) return cart;
    item.quantity += delta;
    if (item.quantity < 1) return Cart.removeItem(productId);
    Cart.saveCart(cart);
    Cart.updateBadge();
    return cart;
  },

  clearCart: () => {
    localStorage.setItem('cart', JSON.stringify([]));
    Cart.updateBadge();
  },

  getTotalItems: () => Cart.getCart().reduce((t, i) => t + i.quantity, 0),
  getTotalPrice: () => Cart.getCart().reduce((t, i) => t + (i.price * i.quantity), 0),

  updateBadge: () => {
    const total = Cart.getTotalItems();
    document.querySelectorAll('.cart-badge').forEach(el => {
      el.textContent = total;
      el.style.display = total > 0 ? 'flex' : 'none';
    });
  },
};

// ============================================================
// CART DRAWER
// ============================================================
const CartDrawer = {
  init: () => {
    if (document.getElementById('cart-drawer')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="cart-overlay" onclick="CartDrawer.close()" style="
        display:none; position:fixed; inset:0;
        background:rgba(0,0,0,0.45); z-index:1998; transition:opacity 0.25s;"></div>

      <div id="cart-drawer" style="
        display:none; position:fixed; top:0; right:0; bottom:0; width:360px;
        background:#fff; z-index:1999;
        flex-direction:column;
        box-shadow:-6px 0 32px rgba(0,0,0,0.12);
        transform:translateX(100%); transition:transform 0.28s cubic-bezier(.4,0,.2,1);">

        <!-- Header -->
        <div style="
          display:flex; justify-content:space-between; align-items:center;
          padding:18px 20px; border-bottom:1px solid #f0f0f0;
          background:linear-gradient(135deg,#dc2626,#f97316);">
          <div style="display:flex;align-items:center;gap:10px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span style="color:white;font-size:16px;font-weight:600;" id="drawer-title">Your Cart</span>
          </div>
          <button onclick="CartDrawer.close()" style="
            background:rgba(255,255,255,0.2); border:none; color:white;
            width:32px;height:32px;border-radius:50%;font-size:18px;
            cursor:pointer;display:flex;align-items:center;justify-content:center;
            transition:background 0.2s;">✕</button>
        </div>

        <!-- Items -->
        <div id="drawer-items" style="flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:14px;"></div>

        <!-- Footer -->
        <div style="padding:16px 20px;border-top:1px solid #f0f0f0;background:#fafafa;">
          <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:6px;">
            <span>Subtotal</span><span id="drawer-subtotal">₱0.00</span>
          </div>
          <div id="drawer-delivery-row" style="display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:10px;">
            <span>Delivery Fee</span><span>₱50.00</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;
            border-top:1px solid #eee;padding-top:10px;margin-bottom:14px;">
            <span>Total</span><span style="color:#dc2626;" id="drawer-total">₱0.00</span>
          </div>
          <button onclick="CartDrawer.checkout()" id="drawer-checkout-btn" style="
            width:100%;padding:13px;
            background:linear-gradient(135deg,#dc2626,#f97316);
            color:white;border:none;border-radius:10px;
            font-size:14px;font-weight:600;cursor:pointer;
            transition:opacity 0.2s;letter-spacing:0.3px;">
            Proceed to Checkout
          </button>
          <div id="drawer-login-note" style="
            font-size:11px;color:#f97316;text-align:center;
            margin-top:8px;display:none;padding:6px;
            background:#fff7ed;border-radius:6px;">
            ⚠ You'll be redirected to login first
          </div>
          <button onclick="CartDrawer.close(); window.location.href='menu.html'" style="
            width:100%;padding:10px;background:none;
            border:1px solid #e5e7eb;border-radius:10px;
            font-size:13px;color:#666;cursor:pointer;margin-top:8px;
            transition:background 0.2s;">
            Continue Shopping
          </button>
        </div>
      </div>
    `);
  },

  open: () => {
    CartDrawer.render();
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    overlay.style.display = 'block';
    drawer.style.display = 'flex';
    requestAnimationFrame(() => {
      drawer.style.transform = 'translateX(0)';
    });
    document.body.style.overflow = 'hidden';
  },

  close: () => {
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    drawer.style.transform = 'translateX(100%)';
    setTimeout(() => {
      overlay.style.display = 'none';
      drawer.style.display = 'none';
    }, 280);
    document.body.style.overflow = '';
  },

  render: () => {
    const items = Cart.getItems();
    const count = items.reduce((s, i) => s + i.quantity, 0);
    document.getElementById('drawer-title').textContent = count > 0 ? `Your Cart (${count})` : 'Your Cart';

    const container = document.getElementById('drawer-items');

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:50px 0;color:#aaa;">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" style="margin:0 auto 14px;">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p style="font-size:15px;font-weight:500;color:#999;margin-bottom:4px;">Your cart is empty</p>
          <p style="font-size:13px;color:#bbb;">Add items from the menu to get started</p>
        </div>`;
      document.getElementById('drawer-checkout-btn').disabled = true;
      document.getElementById('drawer-checkout-btn').style.opacity = '0.5';
    } else {
      document.getElementById('drawer-checkout-btn').disabled = false;
      document.getElementById('drawer-checkout-btn').style.opacity = '1';
      container.innerHTML = items.map(item => `
        <div style="display:flex;gap:12px;padding:12px;background:#fff;
          border:1px solid #f3f4f6;border-radius:10px;align-items:flex-start;">
          <img src="${item.image || 'https://via.placeholder.com/60'}"
            style="width:60px;height:60px;border-radius:8px;object-fit:cover;flex-shrink:0;background:#f3f4f6;"
            onerror="this.src='https://via.placeholder.com/60'" />
          <div style="flex:1;min-width:0;">
            <p style="font-size:13px;font-weight:600;color:#111;margin-bottom:2px;
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</p>
            <p style="font-size:12px;color:#dc2626;font-weight:500;margin-bottom:8px;">
              ₱${parseFloat(item.price).toFixed(2)}</p>
            <div style="display:flex;align-items:center;gap:0;">
              <button onclick="CartDrawer.updateQty(${item.id}, -1)" style="
                width:28px;height:28px;border:1px solid #e5e7eb;border-radius:6px 0 0 6px;
                background:#f9fafb;cursor:pointer;font-size:16px;font-weight:500;
                display:flex;align-items:center;justify-content:center;color:#374151;
                transition:background 0.15s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='#f9fafb'">−</button>
              <span style="width:36px;height:28px;border-top:1px solid #e5e7eb;
                border-bottom:1px solid #e5e7eb;display:flex;align-items:center;
                justify-content:center;font-size:13px;font-weight:600;background:#fff;">${item.quantity}</span>
              <button onclick="CartDrawer.updateQty(${item.id}, 1)" style="
                width:28px;height:28px;border:1px solid #e5e7eb;border-radius:0 6px 6px 0;
                background:#f9fafb;cursor:pointer;font-size:16px;font-weight:500;
                display:flex;align-items:center;justify-content:center;color:#374151;
                transition:background 0.15s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='#f9fafb'">+</button>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
            <span style="font-size:13px;font-weight:700;color:#111;">
              ₱${(item.price * item.quantity).toFixed(2)}</span>
            <button onclick="CartDrawer.removeItem(${item.id})" style="
              background:none;border:none;cursor:pointer;color:#dc2626;
              font-size:11px;padding:3px 6px;border-radius:4px;
              background:#fee2e2;transition:background 0.15s;"
              onmouseover="this.style.background='#fecaca'" onmouseout="this.style.background='#fee2e2'">Remove</button>
          </div>
        </div>
      `).join('');
    }

    const subtotal = Cart.getTotalPrice();
    const delivery = 50;
    document.getElementById('drawer-subtotal').textContent = `₱${subtotal.toFixed(2)}`;
    document.getElementById('drawer-total').textContent = `₱${(subtotal + delivery).toFixed(2)}`;

    const loginNote = document.getElementById('drawer-login-note');
    if (loginNote) loginNote.style.display = Auth && !Auth.isLoggedIn() ? 'block' : 'none';
  },

  updateQty: (productId, delta) => {
    Cart.updateQuantity(productId, delta);
    CartDrawer.render();
  },

  removeItem: (productId) => {
    Cart.removeItem(productId);
    CartDrawer.render();
  },

  checkout: () => {
    if (!Auth || !Auth.isLoggedIn()) {
      sessionStorage.setItem('redirectAfterLogin', 'checkout.html');
      CartDrawer.close();
      setTimeout(() => window.location.href = 'login.html', 300);
      return;
    }
    CartDrawer.close();
    setTimeout(() => window.location.href = 'checkout.html', 300);
  },
};

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();
  CartDrawer.init();
});