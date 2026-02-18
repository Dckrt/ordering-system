// Cart Management
const Cart = {
  // Get cart from localStorage
  getCart: () => JSON.parse(localStorage.getItem('cart') || '[]'),

  // Save cart to localStorage
  saveCart: (cart) => localStorage.setItem('cart', JSON.stringify(cart)),

  // Add item to cart
  addItem: (product) => {
    const cart = Cart.getCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: 1,
      });
    }

    Cart.saveCart(cart);
    Cart.updateBadge();
    return cart;
  },

  // Remove item from cart
  removeItem: (productId) => {
    const cart = Cart.getCart();
    const filtered = cart.filter(item => item.id !== productId);
    Cart.saveCart(filtered);
    Cart.updateBadge();
    return filtered;
  },

  // Update quantity
  updateQuantity: (productId, quantity) => {
    if (quantity < 1) {
      return Cart.removeItem(productId);
    }

    const cart = Cart.getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
      item.quantity = quantity;
      Cart.saveCart(cart);
      Cart.updateBadge();
    }
    return cart;
  },

  // Clear cart
  clearCart: () => {
    localStorage.setItem('cart', JSON.stringify([]));
    Cart.updateBadge();
  },

  // Get total items
  getTotalItems: () => {
    const cart = Cart.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },

  // Get total price
  getTotalPrice: () => {
    const cart = Cart.getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  // Update cart badge in header
  updateBadge: () => {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      const total = Cart.getTotalItems();
      badge.textContent = total;
      badge.style.display = total > 0 ? 'flex' : 'none';
    }
  },
};

// Update badge on page load
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();
});
