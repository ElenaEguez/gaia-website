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

/** Stock máximo vendible según producto/variante del API */
function resolveMaxStock(product, variant = null) {
  if (!product) return null;
  const variants = product.variants || [];
  if (variant?.id) {
    const v = variants.find(x => x.id === variant.id);
    return v ? Math.max(0, parseInt(v.stock, 10) || 0) : 0;
  }
  if (variants.length) return null;
  if (product.stock_total != null) {
    return Math.max(0, parseInt(product.stock_total, 10) || 0);
  }
  return product.stock_available === false ? 0 : null;
}

function _stockMessage(maxStock) {
  return maxStock === 1
    ? 'Solo hay 1 unidad disponible.'
    : `Solo hay ${maxStock} unidades disponibles.`;
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Agrega un producto al carrito.
 * Si ya existe (mismo producto+variante), incrementa la cantidad.
 * @returns {{ ok: boolean, items: CartItem[], message?: string, maxStock?: number }}
 */
function addItem(product, variant = null, qty = 1) {
  const items = _load();
  const id = _itemId(product.id, variant?.id);
  const idx = items.findIndex(i => i.id === id);
  const maxStock = resolveMaxStock(product, variant);
  const requested = (idx >= 0 ? items[idx].quantity : 0) + qty;

  if (maxStock != null && maxStock <= 0) {
    return { ok: false, items, message: 'Producto sin stock.', maxStock: 0 };
  }
  if (maxStock != null && requested > maxStock) {
    return { ok: false, items, message: _stockMessage(maxStock), maxStock };
  }

  const image = product.images?.[0]?.image || null;

  if (idx >= 0) {
    items[idx].quantity += qty;
    if (maxStock != null) items[idx].max_stock = maxStock;
  } else {
    items.push({
      id,
      product_id: product.id,
      variant_id: variant?.id || null,
      name: product.name,
      price: parseFloat(product.price),
      variant_label: variant
        ? [variant.size, variant.color].filter(Boolean).join(' / ')
        : null,
      image,
      quantity: qty,
      max_stock: maxStock,
    });
  }

  _save(items);
  return { ok: true, items, maxStock };
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
 * @returns {{ ok: boolean, items: CartItem[], message?: string }}
 */
function updateQty(itemId, qty) {
  if (qty <= 0) {
    return { ok: true, items: removeItem(itemId) };
  }

  const items = _load();
  const idx = items.findIndex(i => i.id === itemId);
  if (idx < 0) return { ok: false, items, message: 'Ítem no encontrado.' };

  const maxStock = items[idx].max_stock;
  if (maxStock != null && qty > maxStock) {
    return { ok: false, items, message: _stockMessage(maxStock), maxStock };
  }

  items[idx].quantity = qty;
  _save(items);
  return { ok: true, items };
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
    quantity: i.quantity,
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
  resolveMaxStock,
};
