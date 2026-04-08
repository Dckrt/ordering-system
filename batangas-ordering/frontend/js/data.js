// Mock Database using LocalStorage

// Initialize data if not exists
function initializeData() {
  if (!localStorage.getItem('products')) {
    const products = [
      {
        id: '1',
        name: 'Frozen Chicken Wings',
        description: 'Premium quality frozen chicken wings - 1kg pack',
        price: 250,
        image: 'https://images.unsplash.com/photo-1629966207968-16b1027bed09?w=800',
        category: 'Frozen Goods',
        stock: 50,
        status: 'Available',
      },
      {
        id: '2',
        name: 'Frozen Mixed Vegetables',
        description: 'Assorted frozen vegetables - carrots, peas, corn - 500g',
        price: 120,
        image: 'https://images.unsplash.com/photo-1658708009342-af5795fa4284?w=800',
        category: 'Frozen Goods',
        stock: 30,
        status: 'Available',
      },
      {
        id: '3',
        name: 'Filipino Breakfast Meal',
        description: 'Longganisa, fried rice, and sunny side up egg',
        price: 85,
        image: 'https://images.unsplash.com/photo-1715603803244-3387c6085b8a?w=800',
        category: 'Meals',
        stock: 20,
        status: 'Available',
      },
      {
        id: '4',
        name: 'Adobo Combo Meal',
        description: 'Classic Filipino adobo with rice and drink',
        price: 95,
        image: 'https://images.unsplash.com/photo-1767163983834-daa47e7cb7b2?w=800',
        category: 'Meals',
        stock: 15,
        status: 'Available',
      },
      {
        id: '5',
        name: 'Frozen Premium Beef',
        description: 'High-quality frozen beef cuts - 1kg pack',
        price: 450,
        image: 'https://images.unsplash.com/photo-1690983322475-29a61c585204?w=800',
        category: 'Frozen Goods',
        stock: 25,
        status: 'Available',
      },
      {
        id: '6',
        name: 'Frozen Food Bundle',
        description: 'Mix of frozen meats and vegetables - family pack',
        price: 680,
        image: 'https://images.unsplash.com/photo-1760463921658-0fa0ce72c91c?w=800',
        category: 'Frozen Goods',
        stock: 10,
        status: 'Available',
      },
      {
        id: '7',
        name: 'Sisig Rice Bowl',
        description: 'Sizzling sisig with garlic rice',
        price: 90,
        image: 'https://images.unsplash.com/photo-1627378378955-a3f4e406c5de?w=800',
        category: 'Meals',
        stock: 0,
        status: 'Unavailable',
      },
      {
        id: '8',
        name: 'Delivery Package',
        description: 'Complete frozen food delivery bundle',
        price: 520,
        image: 'https://images.unsplash.com/photo-1606722590635-747d0d915f3e?w=800',
        category: 'Frozen Goods',
        stock: 12,
        status: 'Available',
      },
    ];
    localStorage.setItem('products', JSON.stringify(products));
  }

  if (!localStorage.getItem('categories')) {
    const categories = [
      {
        id: '1',
        name: 'Frozen Goods',
        description: 'Premium frozen meats, vegetables, and seafood',
      },
      {
        id: '2',
        name: 'Meals',
        description: 'Ready-to-eat Filipino meals and combo sets',
      },
    ];
    localStorage.setItem('categories', JSON.stringify(categories));
  }

  if (!localStorage.getItem('orders')) {
    const orders = [
      {
        id: '1',
        orderNumber: 'ORD-001',
        customerName: 'Juan Dela Cruz',
        customerEmail: 'juan@email.com',
        customerPhone: '09123456789',
        orderDate: new Date().toISOString(),
        items: [
          { productName: 'Frozen Chicken Wings', quantity: 2, price: 250 },
          { productName: 'Filipino Breakfast Meal', quantity: 1, price: 85 },
        ],
        totalAmount: 585,
        orderType: 'Delivery',
        paymentMethod: 'Cash',
        paymentStatus: 'Pending',
        orderStatus: 'Pending',
        address: '123 Main St, Naga City, Camarines Sur',
      },
      {
        id: '2',
        orderNumber: 'ORD-002',
        customerName: 'Maria Santos',
        customerEmail: 'maria@email.com',
        customerPhone: '09987654321',
        orderDate: new Date().toISOString(),
        items: [
          { productName: 'Frozen Food Bundle', quantity: 1, price: 680 },
        ],
        totalAmount: 680,
        orderType: 'Pick-up',
        paymentMethod: 'Online Transfer',
        paymentStatus: 'Paid',
        orderStatus: 'Preparing',
      },
    ];
    localStorage.setItem('orders', JSON.stringify(orders));
  }

  if (!localStorage.getItem('customers')) {
    const customers = [
      {
        id: '1',
        fullName: 'Admin User',
        email: 'admin@batangas.com',
        password: 'admin',
        phone: '09123456789',
        isAdmin: true,
      },
      {
        id: '2',
        fullName: 'Juan Dela Cruz',
        email: 'juan@email.com',
        password: 'password',
        phone: '09123456789',
        isAdmin: false,
      },
    ];
    localStorage.setItem('customers', JSON.stringify(customers));
  }
}

// Database operations
const DB = {
  // Products
  getProducts: () => JSON.parse(localStorage.getItem('products') || '[]'),
  getProduct: (id) => {
    const products = DB.getProducts();
    return products.find(p => p.id === id);
  },
  saveProducts: (products) => localStorage.setItem('products', JSON.stringify(products)),
  addProduct: (product) => {
    const products = DB.getProducts();
    product.id = Date.now().toString();
    products.push(product);
    DB.saveProducts(products);
    return product;
  },
  updateProduct: (id, updates) => {
    const products = DB.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      DB.saveProducts(products);
      return products[index];
    }
    return null;
  },
  deleteProduct: (id) => {
    const products = DB.getProducts();
    const filtered = products.filter(p => p.id !== id);
    DB.saveProducts(filtered);
  },

  // Categories
  getCategories: () => JSON.parse(localStorage.getItem('categories') || '[]'),
  saveCategories: (categories) => localStorage.setItem('categories', JSON.stringify(categories)),
  addCategory: (category) => {
    const categories = DB.getCategories();
    category.id = Date.now().toString();
    categories.push(category);
    DB.saveCategories(categories);
    return category;
  },
  updateCategory: (id, updates) => {
    const categories = DB.getCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...updates };
      DB.saveCategories(categories);
      return categories[index];
    }
    return null;
  },
  deleteCategory: (id) => {
    const categories = DB.getCategories();
    const filtered = categories.filter(c => c.id !== id);
    DB.saveCategories(filtered);
  },

  // Orders
  getOrders: () => JSON.parse(localStorage.getItem('orders') || '[]'),
  getOrder: (id) => {
    const orders = DB.getOrders();
    return orders.find(o => o.id === id);
  },
  saveOrders: (orders) => localStorage.setItem('orders', JSON.stringify(orders)),
  addOrder: (order) => {
    const orders = DB.getOrders();
    order.id = Date.now().toString();
    const orderCount = orders.length;
    order.orderNumber = `ORD-${String(orderCount + 1).padStart(3, '0')}`;
    order.orderDate = new Date().toISOString();
    orders.push(order);
    DB.saveOrders(orders);
    return order;
  },
  updateOrder: (id, updates) => {
    const orders = DB.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      DB.saveOrders(orders);
      return orders[index];
    }
    return null;
  },
  deleteOrder: (id) => {
    const orders = DB.getOrders();
    const filtered = orders.filter(o => o.id !== id);
    DB.saveOrders(filtered);
  },

  // Customers
  getCustomers: () => JSON.parse(localStorage.getItem('customers') || '[]'),
  getCustomer: (email) => {
    const customers = DB.getCustomers();
    return customers.find(c => c.email === email);
  },
  saveCustomers: (customers) => localStorage.setItem('customers', JSON.stringify(customers)),
  addCustomer: (customer) => {
    const customers = DB.getCustomers();
    customer.id = Date.now().toString();
    customer.isAdmin = false;
    customers.push(customer);
    DB.saveCustomers(customers);
    return customer;
  },
  updateCustomer: (id, updates) => {
    const customers = DB.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      customers[index] = { ...customers[index], ...updates };
      DB.saveCustomers(customers);
      return customers[index];
    }
    return null;
  },
};

// Initialize on load
initializeData();
