/**
 * TAMILARASU ENTERPRISES — Cart State Management
 *
 * For authenticated users: syncs with server API.
 * For guests: uses sessionStorage as fallback.
 */

const CART_SESSION_KEY = 'te_guest_cart';

/**
 * Load cart from server (authenticated) or sessionStorage (guest).
 * @returns {Promise<object>} CartDto
 */
async function loadCart() {
  try {
    const cart = await window.api.get('/api/cart');
    updateCartBadge(cart);
    return cart;
  } catch (err) {
    if (err.status === 401) {
      // Guest: load from sessionStorage
      return getGuestCart();
    }
    console.error('Failed to load cart:', err);
    return getGuestCart();
  }
}

/**
 * Add a product to the cart.
 * @param {number} productId
 * @returns {Promise<object>} Updated CartDto
 */
async function addToCart(productId) {
  try {
    const cart = await window.api.post('/api/cart/items', { productId });
    updateCartBadge(cart);
    showToast('Item added to cart!', 'success');
    return cart;
  } catch (err) {
    if (err.status === 401) {
      return addToGuestCart(productId);
    }
    showToast(err.message || 'Failed to add item', 'error');
    throw err;
  }
}

/**
 * Update quantity of a cart item.
 * @param {number} itemId
 * @param {number} qty
 * @returns {Promise<object>} Updated CartDto
 */
async function updateCartItem(itemId, qty) {
  try {
    const cart = await window.api.put(`/api/cart/items/${itemId}`, { quantity: qty });
    updateCartBadge(cart);
    return cart;
  } catch (err) {
    showToast(err.message || 'Failed to update item', 'error');
    throw err;
  }
}

/**
 * Remove an item from the cart.
 * @param {number} itemId
 * @returns {Promise<object>} Updated CartDto
 */
async function removeCartItem(itemId) {
  try {
    const cart = await window.api.del(`/api/cart/items/${itemId}`);
    updateCartBadge(cart);
    showToast('Item removed from cart', 'success');
    return cart;
  } catch (err) {
    showToast(err.message || 'Failed to remove item', 'error');
    throw err;
  }
}

/**
 * Update the cart badge count in the navbar.
 * @param {object} cart CartDto
 */
function updateCartBadge(cart) {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = cart && cart.items ? cart.items.reduce((sum, i) => sum + i.quantity, 0) : 0;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

// ============================================================
// Guest cart (sessionStorage)
// ============================================================

function getGuestCart() {
  try {
    const raw = sessionStorage.getItem(CART_SESSION_KEY);
    return raw ? JSON.parse(raw) : { items: [], subtotal: 0, tax: 0, total: 0 };
  } catch {
    return { items: [], subtotal: 0, tax: 0, total: 0 };
  }
}

function saveGuestCart(cart) {
  sessionStorage.setItem(CART_SESSION_KEY, JSON.stringify(cart));
  updateCartBadge(cart);
}

function addToGuestCart(productId) {
  const cart = getGuestCart();
  const existing = cart.items.find(i => i.productId === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.items.push({ productId, quantity: 1, productName: 'Product', unitPrice: 0, lineTotal: 0 });
  }
  recalcGuestCart(cart);
  saveGuestCart(cart);
  showToast('Item added to cart!', 'success');
  return cart;
}

function recalcGuestCart(cart) {
  const subtotal = cart.items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
  cart.subtotal = subtotal;
  cart.tax = Math.round(subtotal * 0.18 * 100) / 100;
  cart.total = subtotal + cart.tax;
}

// ============================================================
// Toast notifications
// ============================================================

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}

// ============================================================
// Initialize cart badge on page load
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadCart().catch(() => {});
});

window.cartApi = { loadCart, addToCart, updateCartItem, removeCartItem, updateCartBadge, showToast };
