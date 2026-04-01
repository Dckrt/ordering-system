// Main Application Logic

// Authentication
const Auth = {
  // Check if user is logged in
  isLoggedIn: () => !!localStorage.getItem('currentUser'),

  // Get current user
  getCurrentUser: () => JSON.parse(localStorage.getItem('currentUser') || 'null'),

  // Login
  login: (email, password) => {
    const customer = DB.getCustomer(email);
    if (customer && customer.password === password) {
      // Don't store password in session
      const { password: _, ...userWithoutPassword } = customer;
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return { success: true, user: userWithoutPassword };
    }
    return { success: false, message: 'Invalid credentials' };
  },

  // Register
  register: (userData) => {
    const existing = DB.getCustomer(userData.email);
    if (existing) {
      return { success: false, message: 'Email already registered' };
    }

    const customer = DB.addCustomer(userData);
    const { password: _, ...userWithoutPassword } = customer;
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    return { success: true, user: userWithoutPassword };
  },

  // Logout
  logout: () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/index.html';
  },

  // Check if admin
  isAdmin: () => {
    const user = Auth.getCurrentUser();
    return user && user.isAdmin === true;
  },

  // Require login
  requireLogin: () => {
    if (!Auth.isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },

  // Require admin
  requireAdmin: () => {
    if (!Auth.isAdmin()) {
      alert('Access denied. Admin only.');
      window.location.href = '/index.html';
      return false;
    }
    return true;
  },
};

// Utility Functions
const Utils = {
  // Format currency
  formatCurrency: (amount) => {
    return '₱' + amount.toFixed(2);
  },

  // Format date
  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  // Format datetime
  formatDateTime: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Show notification
  showNotification: (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '10000';
    notification.style.minWidth = '300px';

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  },

  // Confirm dialog
  confirm: (message) => {
    return window.confirm(message);
  },

  // Generate order number
  generateOrderNumber: () => {
    const orders = DB.getOrders();
    const count = orders.length + 1;
    return `ORD-${String(count).padStart(3, '0')}`;
  },
};

// Page-specific initialization
const PageInit = {
  // Index page
  index: () => {
    const productsGrid = document.getElementById('featured-products');
    if (productsGrid) {
      const products = DB.getProducts().filter(p => p.status === 'Available').slice(0, 4);
      productsGrid.innerHTML = products.map(product => `
        <div class="card product-card">
          <img src="${product.image}" alt="${product.name}" class="card-image" />
          <div class="card-content">
            <h3 class="card-title">${product.name}</h3>
            <p class="card-price">${Utils.formatCurrency(product.price)}</p>
          </div>
        </div>
      `).join('');
    }
  },

  // Menu page
  menu: () => {
    let selectedCategory = 'All';
    const productsGrid = document.getElementById('products-grid');
    const categoryFilter = document.getElementById('category-filter');

    const renderProducts = () => {
      const products = DB.getProducts();
      const filtered = selectedCategory === 'All' 
        ? products 
        : products.filter(p => p.category === selectedCategory);

      productsGrid.innerHTML = filtered.map(product => `
        <div class="card product-card">
          ${product.status !== 'Available' ? `
            <div class="product-overlay">
              <span class="product-badge badge-unavailable">Unavailable</span>
            </div>
          ` : product.stock < 10 ? `
            <span class="product-badge badge-low-stock">Low Stock</span>
          ` : ''}
          <img src="${product.image}" alt="${product.name}" class="card-image" />
          <div class="card-content">
            <h3 class="card-title">${product.name}</h3>
            <p class="card-description">${product.description}</p>
            <div class="flex items-center justify-between mb-3">
              <span class="card-price">${Utils.formatCurrency(product.price)}</span>
              <span class="badge ${product.status === 'Available' ? 'badge-success' : 'badge-danger'}">
                ${product.status}
              </span>
            </div>
            <p style="font-size: 0.875rem; color: var(--gray-500); margin-bottom: var(--space-3);">
              Stock: ${product.stock}
            </p>
            <button 
              onclick="addToCart('${product.id}')" 
              class="btn btn-primary" 
              style="width: 100%;"
              ${product.status !== 'Available' ? 'disabled' : ''}
            >
              Add to Cart
            </button>
          </div>
        </div>
      `).join('');
    };

    const renderCategories = () => {
      const categories = ['All', ...new Set(DB.getProducts().map(p => p.category))];
      categoryFilter.innerHTML = categories.map(cat => `
        <button 
          class="category-btn ${cat === selectedCategory ? 'active' : ''}" 
          onclick="selectCategory('${cat}')"
        >
          ${cat}
        </button>
      `).join('');
    };

    window.selectCategory = (category) => {
      selectedCategory = category;
      renderCategories();
      renderProducts();
    };

    window.addToCart = (productId) => {
      const product = DB.getProduct(productId);
      if (product && product.status === 'Available') {
        Cart.addItem(product);
        Utils.showNotification('Product added to cart!');
      }
    };

    renderCategories();
    renderProducts();
  },

  // Cart page
  cart: () => {
    const renderCart = () => {
      const cart = Cart.getCart();
      const cartItems = document.getElementById('cart-items');
      const emptyState = document.getElementById('empty-cart');
      const cartContent = document.getElementById('cart-content');
      const subtotalEl = document.getElementById('subtotal');
      const deliveryFeeEl = document.getElementById('delivery-fee');
      const totalEl = document.getElementById('total');

      if (cart.length === 0) {
        emptyState.classList.remove('hidden');
        cartContent.classList.add('hidden');
        return;
      }

      emptyState.classList.add('hidden');
      cartContent.classList.remove('hidden');

      cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image" />
          <div class="cart-item-details">
            <div class="flex justify-between mb-2">
              <div>
                <h3 class="cart-item-title">${item.name}</h3>
                <p class="cart-item-category">${item.category}</p>
              </div>
              <button onclick="removeFromCart('${item.id}')" class="icon-btn delete">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
            <div class="flex items-center justify-between">
              <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
              <span style="font-size: 1.125rem; font-weight: 600;">
                ${Utils.formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          </div>
        </div>
      `).join('');

      const subtotal = Cart.getTotalPrice();
      const deliveryFee = 50;
      const total = subtotal + deliveryFee;

      subtotalEl.textContent = Utils.formatCurrency(subtotal);
      deliveryFeeEl.textContent = Utils.formatCurrency(deliveryFee);
      totalEl.textContent = Utils.formatCurrency(total);
    };

    window.removeFromCart = (productId) => {
      if (Utils.confirm('Remove this item from cart?')) {
        Cart.removeItem(productId);
        renderCart();
      }
    };

    window.updateQuantity = (productId, quantity) => {
      Cart.updateQuantity(productId, quantity);
      renderCart();
    };

    renderCart();
  },

  // Checkout page
checkout: () => {
  const cart = Cart.getCart();

  // Redirect if cart empty
  if (cart.length === 0) {
    window.location.href = 'index.html';
    return;
  }

  let orderType = 'Delivery';
  let deliveryFee = 50;

  const updateSummary = () => {
    const itemsList = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const deliveryFeeEl = document.getElementById('checkout-delivery');
    const totalEl = document.getElementById('checkout-total');

    itemsList.innerHTML = cart.map(item => `
      <div class="summary-row" style="font-size: 0.875rem;">
        <span>${item.name} × ${item.quantity}</span>
        <span>${Utils.formatCurrency(item.price * item.quantity)}</span>
      </div>
    `).join('');

    const subtotal = Cart.getTotalPrice();
    deliveryFee = orderType === 'Delivery' ? 50 : 0;
    const total = subtotal + deliveryFee;

    subtotalEl.textContent = Utils.formatCurrency(subtotal);
    deliveryFeeEl.textContent = Utils.formatCurrency(deliveryFee);
    totalEl.textContent = Utils.formatCurrency(total);
  };

  // selectOrderType 
  document.querySelectorAll('.order-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const type = btn.dataset.type;
    orderType = type;

    document.getElementById('address-fields').classList.toggle('hidden', type !== 'Delivery');

    updateSummary();
  });
});

  // Handle form submission
  const form = document.getElementById('checkout-form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const order = {
      orderNumber: Utils.generateOrderNumber(),
      orderDate: new Date().toISOString(),
      customerName: formData.get('fullName'),
      customerEmail: formData.get('email'),
      customerPhone: formData.get('phone'),
      address: formData.get('address') || '',
      city: formData.get('city') || 'Naga City',
      notes: formData.get('notes') || '',
      orderType: orderType,
      paymentMethod: formData.get('paymentMethod'),
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      items: cart.map(item => ({
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: Cart.getTotalPrice() + deliveryFee,
    };

    const savedOrder = DB.addOrder(order);

    localStorage.setItem('lastOrder', JSON.stringify(savedOrder));

    Cart.clearCart();

    window.location.href = 'confirmation.html';
  });

  updateSummary();
},


  // Confirmation page
  confirmation: () => {
    const order = JSON.parse(localStorage.getItem('lastOrder') || 'null');
    if (!order) {
      window.location.href = '/index.html';
      return;
    }

    document.getElementById('order-number').textContent = order.orderNumber;
    document.getElementById('customer-name').textContent = order.customerName;
    document.getElementById('order-type').textContent = order.orderType;
    document.getElementById('payment-method').textContent = order.paymentMethod;
    document.getElementById('customer-phone').textContent = order.customerPhone;
    document.getElementById('customer-email').textContent = order.customerEmail;
    document.getElementById('order-status').textContent = order.orderStatus;

    if (order.address) {
      document.getElementById('delivery-address').textContent = `${order.address}, ${order.city}`;
    } else {
      document.getElementById('address-row').style.display = 'none';
    }

    const itemsList = document.getElementById('confirmation-items');
    itemsList.innerHTML = order.items.map(item => `
      <div class="flex justify-between" style="font-size: 0.875rem; margin-bottom: var(--space-2);">
        <span style="color: var(--gray-600);">${item.productName} × ${item.quantity}</span>
        <span style="color: var(--gray-900);">${Utils.formatCurrency(item.price * item.quantity)}</span>
      </div>
    `).join('');

    document.getElementById('order-total').textContent = Utils.formatCurrency(order.totalAmount);
  },

  // Login page
  login: () => {
    let isLoginMode = true;

    window.toggleMode = () => {
      isLoginMode = !isLoginMode;
      document.getElementById('login-form').classList.toggle('hidden');
      document.getElementById('register-form').classList.toggle('hidden');
      document.getElementById('page-title').textContent = isLoginMode ? 'Welcome Back' : 'Create Account';
      document.getElementById('page-subtitle').textContent = isLoginMode 
        ? 'Sign in to your account' 
        : 'Register to start ordering';
    };

    // Login form
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const result = Auth.login(formData.get('email'), formData.get('password'));

      if (result.success) {
        Utils.showNotification('Login successful!');
        if (result.user.isAdmin) {
          window.location.href = '/admin/dashboard.html';
        } else {
          window.location.href = '/index.html';
        }
      } else {
        Utils.showNotification(result.message, 'error');
      }
    });

    // Register form
    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      const result = Auth.register({
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        password: formData.get('password'),
        phone: formData.get('phone'),
      });

      if (result.success) {
        Utils.showNotification('Registration successful!');
        window.location.href = '/index.html';
      } else {
        Utils.showNotification(result.message, 'error');
      }
    });
  },

  // Orders page
  orders: () => {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      window.location.href = '/login.html';
      return;
    }

    const orders = DB.getOrders().filter(o => o.customerEmail === currentUser.email);
    const ordersContainer = document.getElementById('orders-list');

    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <h2>No orders yet</h2>
          <p>Start shopping to see your orders here</p>
          <a href="/menu.html" class="btn btn-primary mt-6">Browse Menu</a>
        </div>
      `;
      return;
    }

    ordersContainer.innerHTML = orders.map(order => `
      <div class="card mb-4">
        <div style="background: linear-gradient(135deg, var(--primary-red), var(--primary-orange)); color: white; padding: var(--space-4);">
          <div class="flex justify-between">
            <div>
              <p style="font-size: 0.875rem; opacity: 0.9;">Order Number</p>
              <p style="font-size: 1.25rem; font-weight: 600;">${order.orderNumber}</p>
            </div>
            <div class="text-right">
              <p style="font-size: 0.875rem; opacity: 0.9;">Order Date</p>
              <p style="font-size: 1rem;">${Utils.formatDate(order.orderDate)}</p>
            </div>
          </div>
        </div>
        <div class="card-content">
          <div class="mb-4">
            ${order.items.map(item => `
              <div class="flex justify-between" style="font-size: 0.875rem; margin-bottom: var(--space-2);">
                <span>${item.productName} × ${item.quantity}</span>
                <span>${Utils.formatCurrency(item.price * item.quantity)}</span>
              </div>
            `).join('')}
          </div>
          <div class="flex justify-between items-center" style="padding-top: var(--space-4); border-top: 1px solid var(--gray-200);">
            <div class="flex gap-2">
              <span class="badge badge-${order.orderStatus === 'Pending' ? 'warning' : order.orderStatus === 'Delivered' ? 'success' : 'info'}">
                ${order.orderStatus}
              </span>
              <span class="badge badge-${order.paymentStatus === 'Paid' ? 'success' : 'yellow'}">
                ${order.paymentStatus}
              </span>
            </div>
            <div class="text-right">
              <p style="font-size: 0.875rem; color: var(--gray-500);">Total Amount</p>
              <p style="font-size: 1.5rem; color: var(--primary-red); font-weight: 600;">
                ${Utils.formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },
};

// Initialize page on load
document.addEventListener('DOMContentLoaded', () => {
  // Determine which page we're on
  const path = window.location.pathname;
  const page = path.split('/').pop().replace('.html', '') || 'index';

  // Call appropriate initialization
  if (PageInit[page]) {
    PageInit[page]();
  }
});
