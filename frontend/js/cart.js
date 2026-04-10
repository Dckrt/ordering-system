// ============================================================
// CART MANAGEMENT
// ============================================================
const Cart = {
  getItems: () => JSON.parse(localStorage.getItem('cart') || '[]'),
  getCart:  () => JSON.parse(localStorage.getItem('cart') || '[]'),
  saveCart: (cart) => localStorage.setItem('cart', JSON.stringify(cart)),

  addItem: (product) => {
    const cart = Cart.getCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: product.id, name: product.name, price: product.price,
        image: product.image, category: product.category, quantity: 1 });
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

document.addEventListener('DOMContentLoaded', () => Cart.updateBadge());