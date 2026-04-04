/**
 * api.js — Wrapper de fetch para el backend de Gaia Bolivia
 * Todos los endpoints apuntan a /api/public/gaia-bolivia/
 */

const API_BASE = 'http://76.13.160.126/api/public/gaia-bolivia';

/**
 * Wrapper interno de fetch con manejo de errores uniforme.
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
async function _request(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    if (!res.ok) {
      let errorBody = {};
      try { errorBody = await res.json(); } catch (_) {}
      const msg = errorBody.detail
        || errorBody.error
        || (errorBody.errors && errorBody.errors.join(' '))
        || `Error ${res.status}`;
      throw new ApiError(msg, res.status, errorBody);
    }

    // 204 No Content
    if (res.status === 204) return null;
    return res.json();

  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Sin conexión con el servidor. Verifica tu internet.', 0, {});
  }
}

/** Error personalizado con código de estado HTTP */
class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.body   = body;
  }
}

// Exportar para uso externo
window.ApiError = ApiError;

// ── Endpoints ─────────────────────────────────────────────────────────────────

/**
 * Información pública de la tienda (nombre, logo, redes, métodos de pago).
 * @returns {Promise<Object>}
 */
async function getStore() {
  return _request(`${API_BASE}/`);
}

/**
 * Lista de productos activos con filtros opcionales.
 * @param {{ category?: number|string, search?: string, page?: number }} filters
 * @returns {Promise<{ count, next, previous, results: Product[] }>}
 */
async function getProducts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.search)   params.set('search',   filters.search);
  if (filters.page)     params.set('page',      filters.page);
  if (filters.ordering) params.set('ordering',  filters.ordering);
  const qs = params.toString();
  return _request(`${API_BASE}/products/${qs ? '?' + qs : ''}`);
}

/**
 * Detalle de un producto (incluye variantes e imágenes).
 * @param {number|string} id
 * @returns {Promise<Product>}
 */
async function getProduct(id) {
  return _request(`${API_BASE}/products/${id}/`);
}

/**
 * Categorías que tienen al menos un producto activo.
 * @returns {Promise<Category[]>}
 */
async function getCategories() {
  return _request(`${API_BASE}/categories/`);
}

/**
 * Crear un pedido (checkout).
 * @param {{
 *   customer_name: string,
 *   customer_phone: string,
 *   customer_email?: string,
 *   customer_address?: string,
 *   delivery_method: 'pickup'|'delivery',
 *   payment_method: 'tigo_money'|'banco_union'|'efectivo',
 *   notes?: string,
 *   items: { product_id: number, variant_id?: number, quantity: number }[]
 * }} orderData
 * @returns {Promise<CartOrder>}
 */
async function checkout(orderData) {
  return _request(`${API_BASE}/checkout/`, {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

/**
 * Consulta el estado de un pedido por ID.
 * @param {number|string} id
 * @returns {Promise<CartOrder>}
 */
async function getOrder(id) {
  return _request(`${API_BASE}/order/${id}/`);
}

/**
 * Sube el comprobante de pago de un pedido.
 * @param {number|string} id
 * @param {File} file
 * @returns {Promise<CartOrder>}
 */
async function uploadReceipt(id, file) {
  const formData = new FormData();
  formData.append('receipt', file);
  return _request(`${API_BASE}/order/${id}/receipt/`, {
    method: 'POST',
    headers: {},           // dejar que el browser ponga multipart boundary
    body: formData,
  });
}

// Exponer globalmente
window.GaiaAPI = {
  getStore,
  getProducts,
  getProduct,
  getCategories,
  checkout,
  getOrder,
  uploadReceipt,
};
