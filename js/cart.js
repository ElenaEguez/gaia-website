/**
 * cart.js — Lógica del carrito de compras en localStorage
 * Clave: 'gaia_cart'
 */

const CART_KEY = 'gaia_cart';

// ── Helpers internos ──────────────────────────────────────────────────────────

function _load() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (_) {
    return [];
  }
}

function _save(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  _dispatchUpdate();
}

/** Dispara evento para que el badge del navbar y otros listeners se actualicen */
function _dispatchUpdate() {
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: getCount() }));
}

/** Genera un ID único para cada ítem basado en producto + variante */
function _itemId(productId, variantId) {
  return variantId ? `${productId}_v${variantId}` : `${productId}`;
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Agrega un producto al carrito.
 * Si ya existe (mismo producto+variante), incrementa la cantidad.
 * @param {Object} product  - { id, name, price, images }
 * @param {Object|null} variant - { id, size, color } | null
 * @param {number} qty
 */
function addItem(product, variant = null, qty = 1) {
  const items = _load();
  const id    = _itemId(product.id, variant?.id);
  const idx   = items.findIndex(i => i.id === id);

  const image = product.images?.[0]?.image || null;

  if (idx >= 0) {
    items[idx].quantity += qty;
  } else {
    items.push({
      id,
      product_id:   product.id,
      variant_id:   variant?.id || null,
      name:         product.name,
      price:        parseFloat(product.price),
      variant_label: variant
        ? [variant.size, variant.color].filter(Boolean).join(' / ')
        : null,
      image,
      quantity: qty,
    });
  }

  _save(items);
  return items;
}

/**
 * Elimina un ítem del carrito por su ID compuesto.
 * @param {string} itemId
 */
function removeItem(itemId) {
  const items = _load().filter(i => i.id !== itemId);
  _save(items);
  return items;
}

/**
 * Actualiza la cantidad de un ítem.
 * Si qty <= 0, elimina el ítem.
 * @param {string} itemId
 * @param {number} qty
 */
function updateQty(itemId, qty) {
  if (qty <= 0) return removeItem(itemId);

  const items = _load();
  const idx   = items.findIndex(i => i.id === itemId);
  if (idx >= 0) {
    items[idx].quantity = qty;
    _save(items);
  }
  return items;
}

/**
 * Devuelve todos los ítems del carrito.
 * @returns {CartItem[]}
 */
function getItems() {
  return _load();
}

/**
 * Calcula el total del carrito en Bs.
 * @returns {number}
 */
function getTotal() {
  return _load().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

/**
 * Devuelve la cantidad total de unidades en el carrito (para el badge).
 * @returns {number}
 */
function getCount() {
  return _load().reduce((sum, i) => sum + i.quantity, 0);
}

/**
 * Vacía el carrito.
 */
function clearCart() {
  _save([]);
}

/**
 * Convierte los ítems del carrito al formato que espera el endpoint /checkout/.
 * @returns {{ product_id, variant_id, quantity }[]}
 */
function toCheckoutItems() {
  return _load().map(i => ({
    product_id: i.product_id,
    variant_id: i.variant_id || undefined,
    quantity:   i.quantity,
  }));
}

// Exponer globalmente
window.GaiaCart = {
  addItem,
  removeItem,
  updateQty,
  getItems,
  getTotal,
  getCount,
  clearCart,
  toCheckoutItems,
};
