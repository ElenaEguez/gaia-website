/**
 * app.js — Inicialización por página y lógica de UI compartida
 * Gaia Bolivia
 */

// ── Cache de productos para addToCart desde cards ─────────────────────────────
var _productCache = new Map();

// ── Navbar ─────────────────────────────────────────────────────────────────────

/**
 * Búsqueda del header: Enter envía a la tienda o actualiza resultados en tienda.html.
 */
function _tiendaSearchHref(query) {
  var q = query || '';
  try {
    return new URL('tienda.html' + (q ? '?search=' + encodeURIComponent(q) : ''), window.location.href).href;
  } catch (_) {
    return 'tienda.html' + (q ? '?search=' + encodeURIComponent(q) : '');
  }
}

function initSiteSearch() {
  var input = document.querySelector('#search-input');
  if (!input) return;

  function submitSearch() {
    var q = (input.value || '').trim();
    if (document.body.dataset.page === 'tienda' && typeof window.__tiendaApplySearch === 'function') {
      window.__tiendaApplySearch(q);
    } else {
      window.location.href = _tiendaSearchHref(q);
    }
  }

  input.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    submitSearch();
  });

  var searchBtn = document.querySelector('.btn-search');
  if (searchBtn) {
    searchBtn.addEventListener('click', function () {
      input.focus({ preventScroll: false });
      try {
        input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (_) {}
    });
  }

  var closeBtn = document.querySelector('#search-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      input.value = '';
      input.blur();
      if (document.body.dataset.page === 'tienda' && typeof window.__tiendaApplySearch === 'function') {
        window.__tiendaApplySearch('');
      }
    });
  }
}

/**
 * Submenú "Tienda": botón ▾ para táctil; clic fuera o Escape cierra.
 */
function initNavDropdowns() {
  var items = document.querySelectorAll('.nav-item.has-dropdown');
  if (!items.length) return;

  function closeAll() {
    items.forEach(function (item) {
      item.classList.remove('is-open');
      var t = item.querySelector('.nav-dropdown-toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  items.forEach(function (item) {
    var toggle = item.querySelector('.nav-dropdown-toggle');
    var menu = item.querySelector('.dropdown-menu');
    if (toggle) {
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var willOpen = !item.classList.contains('is-open');
        closeAll();
        if (willOpen) {
          item.classList.add('is-open');
          toggle.setAttribute('aria-expanded', 'true');
        }
      });
    }
    if (menu) {
      menu.addEventListener('click', function (e) {
        if (e.target.closest('a')) closeAll();
      });
    }
  });

  document.addEventListener('click', function () {
    closeAll();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });
}

/**
 * Menú hamburguesa (móvil): panel lateral, velo y cierre por Escape / resize.
 */
function initMobileNav() {
  var header = document.getElementById('site-header');
  var btn = document.getElementById('btn-menu');
  var nav = document.getElementById('main-nav');
  if (!header || !btn || !nav) return;

  var overlay = document.getElementById('nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'nav-overlay';
    overlay.className = 'nav-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
  }

  function closeDropdownsInNav() {
    nav.querySelectorAll('.nav-item.has-dropdown.is-open').forEach(function (li) {
      li.classList.remove('is-open');
      var t = li.querySelector('.nav-dropdown-toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  function setOpen(open) {
    var o = !!open;
    header.classList.toggle('is-nav-open', o);
    document.body.classList.toggle('menu-open', o);
    document.body.style.overflow = o ? 'hidden' : '';
    btn.setAttribute('aria-expanded', o ? 'true' : 'false');
    btn.setAttribute('aria-label', o ? 'Cerrar menú' : 'Abrir menú');
    overlay.classList.toggle('nav-overlay--visible', o);
    overlay.setAttribute('aria-hidden', o ? 'false' : 'true');
    if (!o) closeDropdownsInNav();
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(!header.classList.contains('is-nav-open'));
  });

  overlay.addEventListener('click', function () {
    setOpen(false);
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('is-nav-open')) setOpen(false);
  });

  var mql = window.matchMedia('(min-width: 901px)');
  function onBreakChange() {
    if (mql.matches) setOpen(false);
  }
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onBreakChange);
  } else if (typeof mql.addListener === 'function') {
    mql.addListener(onBreakChange);
  }
}

function initNavbar() {
  // Cart count — nuevo header (#cart-count) y viejo (#cart-badge)
  var cartCount = document.querySelector('#cart-count');
  var badge     = document.querySelector('#cart-badge');

  function updateCartUI(n) {
    if (cartCount) {
      cartCount.textContent  = n;
      cartCount.dataset.count = n;
    }
    if (badge) {
      badge.textContent   = n;
      badge.style.display = n > 0 ? 'flex' : 'none';
    }
  }

  updateCartUI(GaiaCart.getCount());

  window.addEventListener('cart:updated', function (e) {
    updateCartUI(e.detail);
  });

  // Hamburger (viejo header — carrito/checkout pages)
  var hamburger = document.querySelector('.hamburger');
  var mobileNav = document.querySelector('.mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
    });
  }

  // Marcar enlace activo
  var current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar__nav a, .mobile-nav a, .nav-link').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href && (href === current || (current === '' && href === 'index.html'))) {
      a.classList.add('active');
    }
  });
}

// ── Toast ──────────────────────────────────────────────────────────────────────

function showToast(message, type, duration) {
  type     = type     || 'default';
  duration = duration || 3000;
  var el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className   = 'toast ' + type;
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(function () { el.classList.remove('show'); }, duration);
}
window.showToast = showToast;

// ── Utilidades ─────────────────────────────────────────────────────────────────

function formatPrice(amount) {
  return 'Bs. ' + parseFloat(amount).toFixed(2);
}
window.formatPrice = formatPrice;

var DISCOUNT_STORAGE_KEY = 'gaia_checkout_discount';

function _loadDiscount() {
  try {
    return JSON.parse(localStorage.getItem(DISCOUNT_STORAGE_KEY)) || { code: '', amount: 0 };
  } catch (_) {
    return { code: '', amount: 0 };
  }
}

function _saveDiscount(discount) {
  localStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify(discount || { code: '', amount: 0 }));
}

function _clearDiscount() {
  _saveDiscount({ code: '', amount: 0 });
}

function getParam(key) {
  return new URLSearchParams(location.search).get(key);
}
window.getParam = getParam;

function handleImgError(img) {
  img.onerror = null;
  img.src = 'https://placehold.co/600x800/faf7f5/c78271?text=GAIA';
}
window.handleImgError = handleImgError;

function imgSrc(imgObj) {
  return imgObj ? (imgObj.image || null) : null;
}
window.imgSrc = imgSrc;

// ── Color helpers ──────────────────────────────────────────────────────────────

function getColorFallback(name) {
  name = (name || '').toLowerCase().trim();
  var map = {
    'negro': '#111111', 'black': '#111111',
    'blanco': '#f5f5f0', 'white': '#f5f5f0',
    'rojo': '#c0392b',
    'bordó': '#6d1a2a', 'bordo': '#6d1a2a', 'vino': '#722f37',
    'nude': '#c9a882', 'beige': '#d4b896',
    'camel': '#c19a6b', 'marrón': '#795548', 'marron': '#795548', 'cafe': '#795548',
    'rosa': '#e8b4b8', 'fucsia': '#c71585', 'rosado': '#f48fb1', 'pink': '#f48fb1',
    'verde': '#2d6a4f', 'verde botella': '#2d5a27',
    'azul': '#1a3a5c', 'azul marino': '#001f3f', 'celeste': '#4fc3f7',
    'gris': '#888888', 'plata': '#aaaaaa', 'plateado': '#9e9e9e', 'silver': '#9e9e9e',
    'dorado': '#c9a84c', 'gold': '#c9a84c',
    'animal print': '#8b6914', 'leopardo': '#8b6914',
    'naranja': '#fb8c00', 'orange': '#fb8c00',
    'morado': '#8e24aa', 'violeta': '#7b1fa2', 'lila': '#ba68c8',
    'turquesa': '#00acc1', 'teal': '#00897b',
    'coral': '#ff7043',
    'amarillo': '#fdd835', 'yellow': '#fdd835',
  };
  return map[name] || '#c78271';
}
window.getColorFallback = getColorFallback;

function getVariantColorValue(variant) {
  if (!variant) return '';
  var directHex = variant.color_hex || variant.hex || variant.hex_color || variant.color_code || variant.colour_hex;
  if (directHex && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(directHex)) {
    return directHex;
  }
  return getColorFallback(variant.color || variant.variant_value || '');
}
window.getVariantColorValue = getVariantColorValue;

// Alias legacy
function colorNameToHex(name) { return getColorFallback(name); }
window.colorNameToHex = colorNameToHex;

// ── Etiquetas de tarjeta (stock, descuento, destacados web) ───────────────────

function productHasStock(product) {
  if (product.stock_available === false) return false;
  if (product.stock_available === true) return true;
  var variants = product.variants || [];
  if (variants.length) {
    return variants.some(function (v) {
      return variantHasStock(v);
    });
  }
  return true;
}

function variantHasStock(v) {
  if (!v) return false;
  if (v.disponible === false) return false;
  return (v.stock || 0) > 0;
}

function getProductBadge(product) {
  if (!productHasStock(product)) {
    return { text: 'Sin stock', className: 'product-card__badge--out' };
  }
  if (product.discount_percent) {
    return { text: product.discount_percent + '% OFF', className: 'product-card__badge--sale' };
  }
  if (product.web_is_new) {
    return { text: 'Nuevo', className: 'product-card__badge--new' };
  }
  if (product.web_is_bestseller) {
    return { text: 'Más vendido', className: 'product-card__badge--bestseller' };
  }
  return null;
}

function formatPriceAmount(amount) {
  return parseFloat(amount || 0).toLocaleString('es-BO', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

// ── RENDER PRODUCT CARD (nuevo diseño editorial) ───────────────────────────────

function renderProductCard(product) {
  // Cache para addToCart
  _productCache.set(product.id, product);
  _productCache.set(String(product.id), product);

  var images   = product.images || [];
  var variants = product.variants || [];
  var mainImg  = (images[0] && (images[0].image || images[0].url)) || '';
  var hoverImg = (images[1] && (images[1].image || images[1].url)) || '';

  var price = formatPriceAmount(product.price);
  var badge = getProductBadge(product);
  var badgeHtml = badge
    ? '<span class="product-card__badge ' + badge.className + '">' + badge.text + '</span>'
    : '';

  // Colores únicos desde variantes
  var colorData = [];
  var seen = {};
  variants.forEach(function (v) {
    var c = (v.color || v.variant_value || '').trim();
    if (c && !seen[c]) {
      seen[c] = true;
      colorData.push({ name: c, value: getVariantColorValue(v) });
    }
  });

  var swatchesHtml = '';
  if (colorData.length > 0) {
    var shown = colorData.slice(0, 5).map(function (c) {
      return '<span class="swatch" style="background-color:' + c.value +
             '" title="' + c.name + '" data-color="' + c.name + '"></span>';
    }).join('');
    var extra = colorData.length > 5
      ? '<span class="swatch-more">+' + (colorData.length - 5) + '</span>'
      : '';
    swatchesHtml = '<div class="product-card__colors">' + shown + extra + '</div>';
  }

  var hoverImgHtml = hoverImg
    ? '<img class="product-card__img-hover" src="' + hoverImg + '" alt="' + product.name + '" loading="lazy">'
    : '';

  var hasVariants = variants.length > 0;

  return '<article class="product-card" data-id="' + product.id + '">' +
    '<div class="product-card__img-wrap">' +
      (mainImg
        ? '<img class="product-card__img" src="' + mainImg + '" alt="' + product.name + '" loading="lazy" onerror="handleImgError(this)">'
        : '<img class="product-card__img" src="https://placehold.co/600x800/faf7f5/c78271?text=GAIA" alt="' + product.name + '">') +
      hoverImgHtml +
      badgeHtml +
      '<div class="product-card__overlay">' +
        '<button class="btn-add-cart" onclick="addToCart(event,' + product.id + ',' + hasVariants + ')">' +
          (hasVariants ? 'Ver opciones' : 'Añadir al carrito') +
        '</button>' +
      '</div>' +
    '</div>' +
    '<div class="product-card__info">' +
      '<a href="producto.html?id=' + product.id + '" style="text-decoration:none">' +
        '<h3 class="product-card__name">' + product.name + '</h3>' +
        '<p class="product-card__price">Bs. ' + price + '</p>' +
      '</a>' +
      swatchesHtml +
    '</div>' +
  '</article>';
}

// ── addToCart desde overlay de card ───────────────────────────────────────────

window.addToCart = function (event, productId, hasVariants) {
  if (event) event.stopPropagation();

  if (hasVariants) {
    window.location.href = 'producto.html?id=' + productId;
    return;
  }

  var product = _productCache.get(productId) || _productCache.get(String(productId));
  if (!product) {
    window.location.href = 'producto.html?id=' + productId;
    return;
  }

  GaiaCart.addItem(product, null, 1);
  showToast(product.name + ' añadido al carrito', 'success');
};

// ── quickAddToCart (legacy) ────────────────────────────────────────────────────

function quickAddToCart(id, name, price, img) {
  GaiaCart.addItem({ id: id, name: name, price: price, images: img ? [{ image: img }] : [] }, null, 1);
  showToast(name + ' añadido al carrito', 'success');
}
window.quickAddToCart = quickAddToCart;

// ── HOME (index.html) ──────────────────────────────────────────────────────────

async function initHome() {
  var bestSellersGrid = document.querySelector('#best-sellers');
  var newArrivalsGrid = document.querySelector('#new-arrivals');
  var catsVisual      = document.querySelector('#categories-visual');

  // Skeletons
  function skeletons(grid, n) {
    if (!grid) return;
    grid.innerHTML = Array(n || 8).fill('<div class="product-skeleton"></div>').join('');
  }
  skeletons(bestSellersGrid, 8);
  skeletons(newArrivalsGrid, 4);

  // Info de la tienda
  try {
    var store = await GaiaAPI.getStore();
    window._storeCache = store;
    if (store.whatsapp) {
      var wa = 'https://wa.me/' + store.whatsapp.replace(/\D/g, '');
      document.querySelectorAll('[data-whatsapp]').forEach(function (b) { b.href = wa; });
      var fab = document.querySelector('.whatsapp-fab');
      if (fab) fab.style.display = 'flex';
    }
    if (store.instagram) document.querySelectorAll('[data-instagram]').forEach(function (a) { a.href = store.instagram; });
    if (store.facebook)  document.querySelectorAll('[data-facebook]').forEach(function (a) { a.href = store.facebook; });
    if (store.tiktok)    document.querySelectorAll('[data-tiktok]').forEach(function (a) { a.href = store.tiktok; });
  } catch (_) {}

  // Categorías visuales
  try {
    var cats = await GaiaAPI.getCategories();
    if (catsVisual) {
      catsVisual.innerHTML = cats.length
        ? cats.slice(0, 3).map(function (c) {
            var bg = 'var(--color-bg-soft)';
            return '<a href="tienda.html?category=' + c.id + '" class="cat-visual-card">' +
              '<div class="cat-visual-card__overlay"></div>' +
              '<span class="cat-visual-card__label">' + c.name + '</span>' +
            '</a>';
          }).join('')
        : '';
    }
  } catch (_) {}

  // Más vendidos (marcados en panel + activos en web)
  try {
    var bestsellers = await GaiaAPI.getProducts({ bestseller: true, page: 1, page_size: 8 });
    var bsResults = bestsellers.results || [];
    if (bestSellersGrid) {
      bestSellersGrid.innerHTML = bsResults.length
        ? bsResults.map(renderProductCard).join('')
        : '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">🌿</div>' +
          '<p>Aún no hay productos en «Más vendidos».<br><small>Márcalos desde el panel de productos.</small></p></div>';
      if (bsResults.length && window.animateCards) animateCards('#best-sellers');
    }
  } catch (e) {
    if (bestSellersGrid) bestSellersGrid.innerHTML =
      '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">⚠️</div>' +
      '<p>No se pudieron cargar los productos.<br><small>' + (e.message || '') + '</small></p></div>';
  }

  // Nuevos ingresos (marcados en panel)
  try {
    var newest = await GaiaAPI.getProducts({ new: true, ordering: '-created_at', page: 1, page_size: 4 });
    var newResults = newest.results || [];
    if (newArrivalsGrid) {
      newArrivalsGrid.innerHTML = newResults.length
        ? newResults.map(renderProductCard).join('')
        : '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">✨</div>' +
          '<p>No hay nuevos ingresos por ahora.<br><small>Activa «Nuevos ingresos» en el producto desde el panel.</small></p></div>';
      if (newResults.length && window.animateCards) animateCards('#new-arrivals');
    }
  } catch (_) {
    if (newArrivalsGrid) newArrivalsGrid.innerHTML = '';
  }
}

// ── TIENDA (tienda.html) ───────────────────────────────────────────────────────

async function initTienda() {
  var grid       = document.querySelector('#products-grid');
  var catList    = document.querySelector('#filter-categories');
  var countEl    = document.querySelector('#product-count');
  var paginEl    = document.querySelector('#pagination');
  var sortSelect = document.querySelector('#sort-select');
  var clearBtn   = document.querySelector('#btn-clear-filters');
  var filterToggle = document.querySelector('#filter-toggle');
  var filterPanel  = document.querySelector('#filter-panel');
  var activeFiltersEl = document.querySelector('#active-filters');

  var currentPage     = parseInt(getParam('page'))    || 1;
  var currentCategory = getParam('category')          || '';
  var currentSearch   = getParam('search')            || '';
  var currentOrdering = getParam('ordering')          || '';
  var _allCats        = [];
  function _slugifyCategory(v) {
    return (v || '')
      .toString()
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' y ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  function _resolveCategoryId(raw, cats) {
    if (!raw) return '';
    if (/^\d+$/.test(String(raw))) return String(raw);
    var candidate = _slugifyCategory(raw);
    var normalized = (raw || '').toString().toLowerCase();
    var aliases = {
      vestidos: ['vestidos', 'vestido'],
      blusas: ['blusas', 'blusa', 'tops', 'top'],
      pantalones: ['pantalones', 'pantalon'],
      faldas: ['faldas', 'falda', 'polleras', 'pollera'],
      accesorios: ['accesorios', 'accesorio'],
    };

    var found = (cats || []).find(function (c) {
      var slug = _slugifyCategory(c.name);
      var apiSlug = String(c.slug || '').toLowerCase();
      return slug === candidate || apiSlug === candidate;
    });
    if (found) return String(found.id);

    var group = Object.keys(aliases).find(function (k) {
      return aliases[k].some(function (a) { return normalized.indexOf(a) !== -1 || candidate.indexOf(a) !== -1; });
    });
    if (group) {
      found = (cats || []).find(function (c) {
        var slug = _slugifyCategory(c.name);
        return aliases[group].some(function (a) { return slug.indexOf(a) !== -1; });
      });
    }

    if (!found) {
      found = (cats || []).find(function (c) {
        var slug = _slugifyCategory(c.name);
        return slug.indexOf(candidate) !== -1 || candidate.indexOf(slug) !== -1;
      });
    }
    return found ? String(found.id) : '';
  }

  if (sortSelect && currentOrdering) sortSelect.value = currentOrdering;

  var searchInput = document.querySelector('#search-input');
  if (searchInput && currentSearch) searchInput.value = currentSearch;

  window.__tiendaApplySearch = function (q) {
    currentSearch = q || '';
    currentPage = 1;
    if (searchInput) searchInput.value = currentSearch;
    syncUrl();
    renderActiveFilters();
    loadProducts();
  };

  // Mobile filter toggle
  if (filterToggle && filterPanel) {
    filterToggle.addEventListener('click', function () {
      filterPanel.classList.toggle('open');
    });
  }

  function syncUrl() {
    var p = new URLSearchParams();
    if (currentCategory) p.set('category', currentCategory);
    if (currentSearch)   p.set('search',   currentSearch);
    if (currentOrdering) p.set('ordering', currentOrdering);
    if (currentPage > 1) p.set('page',     currentPage);
    var qs = p.toString();
    history.replaceState({}, '', qs ? '?' + qs : location.pathname);
  }

  function renderActiveFilters() {
    if (!activeFiltersEl) return;
    var chips = [];
    if (currentCategory) {
      var found = _allCats.find(function (c) { return c.id == currentCategory; });
      if (found) {
        chips.push('<span class="filter-chip">' + found.name +
          '<button class="filter-chip-remove" onclick="clearCategory()">×</button></span>');
      }
    }
    if (currentSearch) {
      chips.push('<span class="filter-chip">"' + currentSearch + '"' +
        '<button class="filter-chip-remove" onclick="clearSearch()">×</button></span>');
    }
    activeFiltersEl.innerHTML = chips.join('');
  }

  window.clearCategory = function () {
    currentCategory = ''; currentPage = 1;
    if (catList) catList.querySelectorAll('li').forEach(function (li) { li.classList.remove('active'); });
    if (catList) { var allLi = catList.querySelector('[data-cat-id=""]'); if (allLi) allLi.classList.add('active'); }
    syncUrl(); renderActiveFilters(); loadProducts();
  };
  window.clearSearch = function () {
    currentSearch = ''; currentPage = 1;
    if (searchInput) searchInput.value = '';
    syncUrl(); renderActiveFilters(); loadProducts();
  };

  function showSkeletons(n) {
    if (!grid) return;
    grid.innerHTML = Array(n || 8).fill('<div class="product-skeleton"></div>').join('');
  }

  async function loadProducts() {
    showSkeletons(8);
    if (paginEl) paginEl.innerHTML = '';

    var orderMap = { price_asc: 'price', price_desc: '-price', '-id': '-id', latest: '-id' };
    var apiOrdering = orderMap[currentOrdering] || currentOrdering || undefined;
    var categoryForApi = currentCategory;
    if (categoryForApi && !/^\d+$/.test(String(categoryForApi))) {
      categoryForApi = _resolveCategoryId(categoryForApi, _allCats);
    }

    try {
      var data = await GaiaAPI.getProducts({
        page:     currentPage,
        category: categoryForApi || undefined,
        search:   currentSearch   || undefined,
        ordering: apiOrdering,
      });

      var results = data.results || [];
      if (currentOrdering === 'price_asc')  results = results.slice().sort(function (a, b) { return a.price - b.price; });
      if (currentOrdering === 'price_desc') results = results.slice().sort(function (a, b) { return b.price - a.price; });

      if (grid) {
        grid.innerHTML = results.length
          ? results.map(renderProductCard).join('')
          : '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">🌿</div><h3>Sin resultados</h3><p>Prueba con otro término o categoría.</p></div>';

        if (results.length && window.animateCards) animateCards('#products-grid');
      }

      if (countEl) {
        countEl.textContent = data.count
          ? (data.count + ' producto' + (data.count !== 1 ? 's' : ''))
          : '';
      }

      renderPagination(paginEl, data, currentPage, function (p) {
        currentPage = p;
        syncUrl();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadProducts();
      });
    } catch (e) {
      if (grid) grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">' +
        '<div class="empty-state__icon">⚠️</div><h3>Error al cargar</h3>' +
        '<p>' + (e.message || 'No se pudo conectar con el servidor') + '</p></div>';
    }
  }

  async function loadCategories() {
    try {
      _allCats = await GaiaAPI.getCategories();
      if (currentCategory && !/^\d+$/.test(String(currentCategory))) {
        var mapped = _resolveCategoryId(currentCategory, _allCats);
        if (mapped) {
          currentCategory = mapped;
          syncUrl();
        }
      }
      if (!catList) return;

      catList.innerHTML =
        '<li class="' + (!currentCategory ? 'active' : '') + '" data-cat-id="">' +
          '<span>Todas las categorías</span>' +
        '</li>' +
        _allCats.map(function (c) {
          return '<li class="' + (currentCategory == c.id ? 'active' : '') + '" data-cat-id="' + c.id + '">' +
            '<span>' + c.name + '</span>' +
            (c.product_count != null ? '<span class="cat-count" style="margin-left:auto;font-size:11px;color:var(--color-text-muted)">(' + c.product_count + ')</span>' : '') +
          '</li>';
        }).join('');

      catList.addEventListener('click', function (e) {
        var li = e.target.closest('[data-cat-id]');
        if (!li) return;
        currentCategory = li.dataset.catId;
        catList.querySelectorAll('li').forEach(function (l) { l.classList.remove('active'); });
        li.classList.add('active');
        currentPage = 1;
        syncUrl();
        renderActiveFilters();
        loadProducts();
      });

      renderActiveFilters();
    } catch (_) {}
  }

  // Sort
  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      currentOrdering = sortSelect.value;
      currentPage = 1;
      syncUrl();
      loadProducts();
    });
  }

  // Search from header (URL param already set)
  if (currentSearch && countEl) {
    renderActiveFilters();
  }

  // Clear filters
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      currentCategory = '';
      currentSearch   = '';
      currentOrdering = '';
      currentPage     = 1;
      if (sortSelect) sortSelect.value = '';
      if (searchInput) searchInput.value = '';
      if (catList) {
        catList.querySelectorAll('li').forEach(function (l) { l.classList.remove('active'); });
        var allLi = catList.querySelector('[data-cat-id=""]');
        if (allLi) allLi.classList.add('active');
      }
      syncUrl();
      renderActiveFilters();
      loadProducts();
    });
  }

  await loadCategories();
  await loadProducts();
}

// ── PRODUCTO DETALLE (producto.html) ───────────────────────────────────────────

async function initProducto() {
  var id = getParam('id');
  if (!id) { location.href = 'tienda.html'; return; }

  var container = document.querySelector('#product-detail');
  if (!container) return;
  container.innerHTML = '<div class="spinner"></div>';

  try {
    var p = await GaiaAPI.getProduct(id);
    document.title = p.name + ' — Gaia Bolivia';
    renderProductDetail(p, container);
    if (p.category && p.category.id) loadRelatedProducts(p.category.id, p.id);
  } catch (e) {
    container.innerHTML = '<div class="empty-state">' +
      '<div class="empty-state__icon">😕</div>' +
      '<h3>Producto no encontrado</h3>' +
      '<p>' + e.message + '</p>' +
      '<a href="tienda.html" class="btn-primary" style="margin-top:24px">Volver a la tienda</a>' +
      '</div>';
  }
}

// ── RENDER PRODUCT DETAIL (nuevo diseño) ───────────────────────────────────────

function renderProductDetail(p, container) {
  var imgs     = p.images || [];
  var variants = p.variants || [];
  var hasSizes  = variants.some(function (v) { return v.size; });
  var hasColors = variants.some(function (v) { return v.color; });
  var hasVars   = variants.length > 0;
  var mainImg   = (imgs[0] && imgs[0].image) || 'https://placehold.co/600x900/faf7f5/c78271?text=GAIA';
  var price     = parseFloat(p.price || 0).toLocaleString('es-BO', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });

  // Thumbnails
  var thumbsHtml = imgs.map(function (im, i) {
    return '<div class="gallery-thumb' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '">' +
      '<img src="' + im.image + '" alt="' + p.name + ' ' + (i + 1) + '" loading="lazy" onerror="handleImgError(this)">' +
    '</div>';
  }).join('');

  // Color swatches
  var colorHtml = '';
  if (hasColors) {
    var colorNames = [];
    var seen = {};
    var variantMap = {};
    variants.forEach(function (v) {
      if (v.color && !seen[v.color]) {
        seen[v.color] = true;
        colorNames.push(v.color);
      }
      if (v.color) {
        variantMap[v.color] = v.color_hex || null;
      }
    });
    colorHtml = '<div class="detail-option">' +
      '<p class="option-label">COLOR: <strong id="selected-color-name"></strong></p>' +
      '<div class="detail-swatches" id="color-swatches">' +
        colorNames.map(function (c) {
          var hex = variantMap[c] || getColorFallback(c);
          var inStock = variants.some(function (v) { return v.color === c && variantHasStock(v); });
          return '<button class="swatch-detail' + (!inStock ? ' oos' : '') + '" style="background-color:' + hex + '"' +
            ' data-color="' + c + '" title="' + c + (inStock ? '' : ' (agotado)') + '"' +
            (inStock ? '' : ' disabled') +
            ' onclick="selectDetailColor(\'' + c + '\',this)"></button>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  // Talle buttons
  var talleHtml = '';
  if (hasSizes) {
    var sizes = [];
    var sizeSeen = {};
    variants.forEach(function (v) { if (v.size && !sizeSeen[v.size]) { sizeSeen[v.size] = true; sizes.push(v.size); } });
    talleHtml = '<div class="detail-option">' +
      '<p class="option-label">TALLE: <strong id="selected-talle-name"></strong></p>' +
      '<div class="detail-talles" id="talle-options">' +
        sizes.map(function (s) {
          var inStock = variants.some(function (v) { return v.size === s && variantHasStock(v); });
          return '<button class="talle-btn' + (!inStock ? ' oos' : '') + '" data-size="' + s + '"' +
            (inStock ? '' : ' disabled') +
            ' onclick="selectDetailSize(\'' + s + '\',this)">' + s + '</button>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  container.innerHTML =
    '<div class="product-detail">' +

      '<!-- Galería -->' +
      '<div class="product-gallery">' +
        '<div class="gallery-thumbs" id="gallery-thumbs">' + thumbsHtml + '</div>' +
        '<div class="gallery-main" id="gallery-main">' +
          '<img id="main-product-img" src="' + mainImg + '" alt="' + p.name + '" onerror="handleImgError(this)">' +
          (imgs.length > 1 ? '<button class="gallery-prev" id="gallery-prev">&#8249;</button><button class="gallery-next" id="gallery-next">&#8250;</button>' : '') +
        '</div>' +
      '</div>' +

      '<!-- Info -->' +
      '<div class="product-info">' +
        '<p class="product-category-label">' + (p.category ? p.category.name : '') + '</p>' +
        '<h1 class="product-name">' + p.name + '</h1>' +
        '<p class="product-price">Bs. ' + price + '</p>' +
        colorHtml +
        talleHtml +
        '<div class="detail-option">' +
          '<p class="option-label">CANTIDAD</p>' +
          '<div class="qty-selector">' +
            '<button class="qty-btn" onclick="changeDetailQty(-1)">−</button>' +
            '<span class="qty-value" id="qty-value" data-max="999">1</span>' +
            '<button class="qty-btn" onclick="changeDetailQty(1)">+</button>' +
          '</div>' +
        '</div>' +
        '<button class="btn-add-to-cart-detail" id="add-to-cart-btn"' +
          (hasVars ? ' disabled' : '') +
          ' onclick="addDetailToCart()">' +
          'Añadir al carrito' +
        '</button>' +
        (hasVars ? '<p style="font-size:12px;color:var(--color-text-muted);margin-top:4px;font-family:var(--font-sans)">Selecciona una opción para continuar</p>' : '') +
        (p.description ? '<div class="product-description">' + p.description + '</div>' : '') +
        '<a class="btn-whatsapp" href="#" id="btn-whatsapp-product" data-whatsapp target="_blank">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">' +
            '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.122 1.524 5.854L.063 23.43l5.731-1.447A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-4.992-1.368l-.358-.213-3.706.936.988-3.606-.233-.371A9.817 9.817 0 012.182 12c0-5.421 4.397-9.818 9.818-9.818S21.818 6.579 21.818 12 17.421 21.818 12 21.818z"/>' +
          '</svg>' +
          'Consultar por WhatsApp' +
        '</a>' +
      '</div>' +

    '</div>';

  // Estado global
  window._currentProduct  = p;
  window._selectedVariant = null;
  window._selectedSize    = null;
  window._selectedColor   = null;
  window._detailQty       = 1;
  window._galleryIndex    = 0;

  // Gallery thumbs
  var thumbEls = container.querySelectorAll('.gallery-thumb');
  thumbEls.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      var idx = parseInt(thumb.dataset.idx);
      _switchGalleryImg(idx, imgs);
    });
  });

  // Gallery prev/next
  var prevBtn = container.querySelector('#gallery-prev');
  var nextBtn = container.querySelector('#gallery-next');
  if (prevBtn) prevBtn.addEventListener('click', function () {
    window._galleryIndex = (window._galleryIndex - 1 + imgs.length) % imgs.length;
    _switchGalleryImg(window._galleryIndex, imgs);
  });
  if (nextBtn) nextBtn.addEventListener('click', function () {
    window._galleryIndex = (window._galleryIndex + 1) % imgs.length;
    _switchGalleryImg(window._galleryIndex, imgs);
  });

  // WhatsApp product link
  if (window._storeCache && window._storeCache.whatsapp) {
    var wa = 'https://wa.me/' + window._storeCache.whatsapp.replace(/\D/g, '') +
      '?text=' + encodeURIComponent('Hola! Me interesa: ' + p.name);
    var waBtns = container.querySelectorAll('[data-whatsapp]');
    waBtns.forEach(function (b) { b.href = wa; });
  }

  // Breadcrumb
  var bcCat  = document.querySelector('#bc-category');
  var bcProd = document.querySelector('#bc-product');
  if (bcCat && p.category) {
    bcCat.textContent = p.category.name;
    bcCat.href = 'tienda.html?category=' + p.category.id;
  }
  if (bcProd) bcProd.textContent = p.name;
}

function _switchGalleryImg(idx, imgs) {
  if (!imgs[idx]) return;
  window._galleryIndex = idx;
  var mainImg = document.querySelector('#main-product-img');
  if (mainImg) {
    mainImg.style.opacity = '0';
    setTimeout(function () {
      mainImg.src = imgs[idx].image;
      mainImg.style.opacity = '1';
    }, 150);
  }
  document.querySelectorAll('.gallery-thumb').forEach(function (t, i) {
    t.classList.toggle('active', i === idx);
  });
}

// ── Selectores de variante detalle ────────────────────────────────────────────

window.selectDetailColor = function (color, btn) {
  if (!btn || btn.disabled || btn.classList.contains('oos')) return;
  document.querySelectorAll('.swatch-detail').forEach(function (s) { s.classList.remove('active'); });
  btn.classList.add('active');
  window._selectedColor = color;
  var lbl = document.querySelector('#selected-color-name');
  if (lbl) lbl.textContent = color;
  _resolveVariant();
};

window.selectDetailSize = function (size, btn) {
  if (!btn || btn.disabled || btn.classList.contains('oos')) return;
  document.querySelectorAll('.talle-btn').forEach(function (s) { s.classList.remove('active'); });
  btn.classList.add('active');
  window._selectedSize = size;
  var lbl = document.querySelector('#selected-talle-name');
  if (lbl) lbl.textContent = size;
  _resolveVariant();
};

// Mantener aliases legacy
window.selectVariantAttr = function (attr, val, btn) {
  if (attr === 'size') window.selectDetailSize(val, btn);
  else window.selectDetailColor(val, btn);
};

function _resolveVariant() {
  var p = window._currentProduct;
  if (!p || !p.variants || !p.variants.length) return;
  var hasSizes  = p.variants.some(function (v) { return v.size; });
  var hasColors = p.variants.some(function (v) { return v.color; });
  var found = null;

  if (hasSizes && hasColors) {
    if (window._selectedSize && window._selectedColor) {
      found = p.variants.find(function (v) {
        return v.size === window._selectedSize && v.color === window._selectedColor;
      });
    }
  } else if (hasSizes) {
    found = window._selectedSize
      ? p.variants.find(function (v) { return v.size === window._selectedSize; })
      : null;
  } else {
    found = window._selectedColor
      ? p.variants.find(function (v) { return v.color === window._selectedColor; })
      : null;
  }

  window._selectedVariant = found ? { id: found.id, size: found.size, color: found.color } : null;
  if (found) {
    _applyVariantStock(found);
  } else {
    var addBtn = document.querySelector('#add-to-cart-btn');
    if (addBtn) addBtn.disabled = true;
  }
}

function _applyVariantStock(v) {
  if (!v) return;
  var inStock = variantHasStock(v);
  var addBtn  = document.querySelector('#add-to-cart-btn');
  var qtyEl   = document.querySelector('#qty-value, #detail-qty');
  if (addBtn) addBtn.disabled = !inStock;
  if (qtyEl && inStock) {
    window._detailQty  = 1;
    qtyEl.textContent  = 1;
    qtyEl.dataset.max  = v.stock;
  }
}

window.changeDetailQty = function (delta) {
  var el  = document.querySelector('#qty-value') || document.querySelector('#detail-qty');
  var max = parseInt(el && el.dataset.max) || 999;
  window._detailQty = Math.min(max, Math.max(1, (window._detailQty || 1) + delta));
  if (el) el.textContent = window._detailQty;
};

window.addDetailToCart = function () {
  var p = window._currentProduct;
  if (!p) return;
  GaiaCart.addItem(p, window._selectedVariant, window._detailQty || 1);
  showToast(p.name + ' añadido al carrito', 'success');
  var btn = document.querySelector('#add-to-cart-btn');
  if (btn) {
    var orig = btn.textContent;
    btn.textContent = '✓ Añadido';
    setTimeout(function () { btn.textContent = orig; }, 2000);
  }
};

window.buyNow = function () {
  var p = window._currentProduct;
  if (!p) return;
  GaiaCart.addItem(p, window._selectedVariant, window._detailQty || 1);
  location.href = 'checkout.html';
};

// ── Relacionados ───────────────────────────────────────────────────────────────

async function loadRelatedProducts(categoryId, excludeId) {
  var section = document.querySelector('#related-section');
  var relGrid = document.querySelector('#related-grid');
  if (!section || !relGrid) return;
  try {
    var data    = await GaiaAPI.getProducts({ category: categoryId, page: 1 });
    var related = (data.results || []).filter(function (pr) { return pr.id != excludeId; }).slice(0, 4);
    if (!related.length) return;
    section.style.display = '';
    relGrid.innerHTML = related.map(renderProductCard).join('');
    if (window.animateCards) animateCards('#related-grid');
  } catch (_) {}
}

// ── Paginación ─────────────────────────────────────────────────────────────────

function renderPagination(el, data, currentPage, onPageChange) {
  if (!el) return;
  window._paginationCb = onPageChange;
  // Derivar tamaño de página del response real para evitar páginas faltantes
  var results   = data.results || [];
  var pageSize  = (data.next && results.length > 0) ? results.length : null;
  var total     = pageSize
    ? Math.ceil(data.count / pageSize)
    : currentPage; // si estamos en última página, al menos currentPage
  if (total <= 1) { el.innerHTML = ''; return; }

  function pageRange(cur, tot) {
    if (tot <= 7) return Array.from({ length: tot }, function (_, i) { return i + 1; });
    if (cur <= 4)       return [1, 2, 3, 4, 5, '…', tot];
    if (cur >= tot - 3) return [1, '…', tot-4, tot-3, tot-2, tot-1, tot];
    return [1, '…', cur-1, cur, cur+1, '…', tot];
  }

  var pages = pageRange(currentPage, total);
  var html  = '<nav class="pagination" aria-label="Paginación de productos">';
  html += '<button class="page-btn page-btn--nav" onclick="_paginationCb(' + (currentPage - 1) + ')"' +
    (currentPage === 1 ? ' disabled' : '') + ' aria-label="Anterior">Anterior</button>';
  pages.forEach(function (p) {
    if (p === '…') {
      html += '<span class="page-ellipsis">…</span>';
    } else {
      html += '<button class="page-btn' + (p === currentPage ? ' active' : '') + '"' +
        ' onclick="_paginationCb(' + p + ')" aria-label="Página ' + p + '">' + p + '</button>';
    }
  });
  html += '<button class="page-btn page-btn--nav" onclick="_paginationCb(' + (currentPage + 1) + ')"' +
    (currentPage === total ? ' disabled' : '') + ' aria-label="Siguiente">Siguiente</button>';
  html += '</nav>';
  html += '<p class="pagination-meta">Página ' + currentPage + ' de ' + total + '</p>';
  el.innerHTML = html;
}

// ── CARRITO (carrito.html) ─────────────────────────────────────────────────────

function initCarrito() {
  renderCartPage();
  window.addEventListener('cart:updated', function () { renderCartPage(); });
}

// ── CHECKOUT (checkout.html) ───────────────────────────────────────────────────

async function initCheckout() {
  var items = GaiaCart.getItems();
  if (!items.length) { location.href = 'carrito.html'; return; }

  renderCheckoutSummary(items);

  var form = document.querySelector('#checkout-form');
  if (!form) return;

  var storeData = null;
  try {
    storeData = await GaiaAPI.getStore();
    window._storeCache = storeData;
  } catch (_) {
    storeData = window._storeCache || null;
  }

  var panel1  = document.querySelector('#step-panel-1');
  var panel2  = document.querySelector('#step-panel-2');
  var btnNext = document.querySelector('#btn-next');
  var btnBack = document.querySelector('#btn-back');
  var cashRadio = form.querySelector('input[name=payment_method][value=efectivo]');
  var cashCard = cashRadio && cashRadio.closest ? cashRadio.closest('.payment-card') : null;
  var bankRadio = form.querySelector('input[name=payment_method][value=banco_union]');
  var qrDownloadBtn = document.querySelector('#btn-download-qr');

  function requiresNonCashPayment() {
    var deliveryMethod = form.querySelector('input[name=delivery_method]:checked');
    if (!deliveryMethod || deliveryMethod.value !== 'delivery') return false;
    var zone = form.querySelector('input[name=delivery_zone]:checked');
    return !!zone && ['nacional', 'santa_cruz'].includes(zone.value);
  }

  function syncPaymentAvailability() {
    if (!cashRadio) return;
    var disableCash = requiresNonCashPayment();
    cashRadio.disabled = disableCash;
    if (cashCard) cashCard.classList.toggle('disabled', disableCash);
    if (disableCash && cashRadio.checked) {
      cashRadio.checked = false;
      if (cashCard) cashCard.classList.remove('selected');
      if (bankRadio) {
        bankRadio.checked = true;
        bankRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
      showToast('Para envío nacional o Santa Cruz, el pago en efectivo no está disponible.', 'default');
    }
  }

  if (btnNext) {
    btnNext.addEventListener('click', function () {
      if (!validateStep1(form)) return;
      panel1.style.display = 'none';
      panel2.style.display = '';
      var stepDatos = document.querySelector('#step-datos');
      var stepPago  = document.querySelector('#step-pago');
      var stepLine2 = document.querySelector('#step-line-2');
      if (stepDatos) { stepDatos.classList.remove('active'); stepDatos.classList.add('done'); stepDatos.querySelector('.step__dot').textContent = '✓'; }
      if (stepLine2) stepLine2.classList.add('done');
      if (stepPago)  stepPago.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', function () {
      panel2.style.display = 'none';
      panel1.style.display = '';
      var stepDatos = document.querySelector('#step-datos');
      var stepPago  = document.querySelector('#step-pago');
      var stepLine2 = document.querySelector('#step-line-2');
      if (stepDatos) { stepDatos.classList.add('active'); stepDatos.classList.remove('done'); stepDatos.querySelector('.step__dot').textContent = '2'; }
      if (stepLine2) stepLine2.classList.remove('done');
      if (stepPago)  stepPago.classList.remove('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (!GaiaCart.getItems().length) {
    _clearDiscount();
  }

  form.querySelectorAll('input[name=delivery_method]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      form.querySelectorAll('input[name=delivery_method]').forEach(function (r) {
        if (r.closest) r.closest('.delivery-card') && r.closest('.delivery-card').classList.remove('selected');
      });
      radio.closest && radio.closest('.delivery-card') && radio.closest('.delivery-card').classList.add('selected');
      var ag = document.querySelector('#address-group');
      if (ag) ag.classList.toggle('show', radio.value === 'delivery');
      var zoneWrap = document.querySelector('#delivery-suboptions');
      if (zoneWrap) zoneWrap.classList.toggle('show', radio.value === 'delivery');
      if (radio.value !== 'delivery') {
        form.querySelectorAll('input[name=delivery_zone]').forEach(function (zoneInput) { zoneInput.checked = false; });
      }
      syncPaymentAvailability();
    });
  });

  form.querySelectorAll('input[name=delivery_zone]').forEach(function (zoneInput) {
    zoneInput.addEventListener('change', syncPaymentAvailability);
  });

  form.querySelectorAll('input[name=payment_method]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      form.querySelectorAll('input[name=payment_method]').forEach(function (r) {
        if (r.closest) r.closest('.payment-card') && r.closest('.payment-card').classList.remove('selected');
      });
      radio.closest && radio.closest('.payment-card') && radio.closest('.payment-card').classList.add('selected');
      var qrPreview      = document.querySelector('#payment-qr-preview');
      var qrPreviewImg   = document.querySelector('#qr-preview-img');
      var qrInstructions = document.querySelector('#qr-preview-instructions');
      var qrName         = document.querySelector('#qr-method-name');
      var showQR = ['banco_union'].includes(radio.value);
      if (qrPreview) qrPreview.style.display = showQR ? '' : 'none';
      if (qrName)    qrName.textContent = radio.value === 'banco_union' ? 'Banco Unión' : 'Pago QR';
      var qrMethod = storeData && storeData.payment_methods && storeData.payment_methods.find(function (m) { return m.type === 'qr'; });
      if (qrPreviewImg) {
        qrPreviewImg.src = (qrMethod && qrMethod.qr_image) || 'https://placehold.co/200x200/e8d5b0/9e7d4a?text=QR+Pago';
        if (qrDownloadBtn) qrDownloadBtn.href = qrPreviewImg.src;
      }
      if (qrInstructions) qrInstructions.textContent = (qrMethod && qrMethod.instructions) || 'El QR de pago definitivo se generará al confirmar tu pedido.';
    });
  });

  if (qrDownloadBtn) {
    qrDownloadBtn.addEventListener('click', function (e) {
      var qrPreviewImg = document.querySelector('#qr-preview-img');
      if (!qrPreviewImg || !qrPreviewImg.src) {
        e.preventDefault();
        showToast('Aun no hay QR disponible para descargar.', 'error');
        return;
      }
      qrDownloadBtn.href = qrPreviewImg.src;
    });
  }

  syncPaymentAvailability();

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validateCheckoutForm(form)) return;
    var submitBtn = document.querySelector('#btn-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:.5rem"><span class="spinner" style="width:18px;height:18px;margin:0;border-width:2px;border-color:rgba(255,255,255,.3);border-top-color:#fff"></span> Procesando...</span>';
    }
    var data = {
      customer_name:    form.customer_name.value.trim(),
      customer_phone:   form.customer_phone.value.trim(),
      customer_email:   (form.customer_email && form.customer_email.value.trim()) || '',
      customer_address: (form.customer_address && form.customer_address.value.trim()) || '',
      delivery_method:  form.delivery_method.value,
      payment_method:   form.payment_method.value,
      notes:            (form.notes && form.notes.value.trim()) || '',
      cupon_codigo:     (_loadDiscount().code || ''),
      items:            GaiaCart.toCheckoutItems(),
    };
    try {
      var order = await GaiaAPI.checkout(data);
      GaiaCart.clearCart();
      location.href = 'confirmacion.html?order_id=' + order.id;
    } catch (err) {
      showToast(err.message, 'error', 5000);
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Confirmar Pedido →'; }
    }
  });
}

// ── CONFIRMACIÓN (confirmacion.html) ──────────────────────────────────────────

async function initConfirmacion() {
  var orderId = getParam('order_id');
  if (!orderId) { location.href = 'index.html'; return; }
  var container = document.querySelector('#order-detail');
  if (container) container.innerHTML = '<div class="spinner"></div>';
  try {
    var order = await GaiaAPI.getOrder(orderId);
    renderOrderConfirmation(order, container);
    initReceiptUpload(orderId);
  } catch (e) {
    if (container) container.innerHTML = '<p class="text-center">' + e.message + '</p>';
  }
}

// ── Render helpers (carrito / checkout / confirmacion) ─────────────────────────

function renderCartPage() {
  var container = document.querySelector('#cart-items');
  var summary   = document.querySelector('#cart-summary');
  var items     = GaiaCart.getItems();
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<div class="empty-state" style="padding:5rem 1rem">' +
      '<div class="empty-state__icon">🛒</div>' +
      '<h3>Tu carrito está vacío</h3>' +
      '<p>Explora nuestra tienda y agrega productos que te gusten.</p>' +
      '<a href="tienda.html" class="btn btn-primary mt-3">Ir a la tienda</a>' +
      '</div>';
    if (summary) summary.innerHTML = '';
    return;
  }
  container.innerHTML = '<div class="cart-table">' +
    '<div class="cart-table-head"><span></span><span>Producto</span>' +
    '<span style="text-align:center">Precio</span><span style="text-align:center">Cantidad</span>' +
    '<span style="text-align:right">Subtotal</span><span></span></div>' +
    items.map(function (item) {
      return '<div class="cart-row" data-id="' + item.id + '">' +
        '<div class="cart-row__img"><img src="' + (item.image || 'https://placehold.co/80x80/faf7f5/c78271?text=G') + '"' +
          ' alt="' + item.name + '" onerror="handleImgError(this)"></div>' +
        '<div class="cart-row__info"><p class="cart-row__name">' + item.name + '</p>' +
          (item.variant_label ? '<p class="cart-row__variant">' + item.variant_label + '</p>' : '') + '</div>' +
        '<div class="cart-row__price">' + formatPrice(item.price) + '</div>' +
        '<div class="cart-row__qty">' +
          '<button class="qty-btn" onclick="GaiaCart.updateQty(\'' + item.id + '\',' + (item.quantity - 1) + ')" aria-label="Quitar uno">−</button>' +
          '<span class="qty-value">' + item.quantity + '</span>' +
          '<button class="qty-btn" onclick="GaiaCart.updateQty(\'' + item.id + '\',' + (item.quantity + 1) + ')" aria-label="Agregar uno">+</button>' +
        '</div>' +
        '<div class="cart-row__subtotal">' + formatPrice(item.price * item.quantity) + '</div>' +
        '<div class="cart-row__remove"><button class="cart-item__remove"' +
          ' onclick="GaiaCart.removeItem(\'' + item.id + '\')" title="Eliminar">✕</button></div>' +
      '</div>';
    }).join('') +
  '</div>';
  if (summary) {
    var total = GaiaCart.getTotal();
    var count = GaiaCart.getCount();
    summary.innerHTML = '<div class="order-summary">' +
      '<h3 class="order-summary__title">Resumen del pedido</h3>' +
      '<div class="order-summary__row"><span>Subtotal (' + count + ' producto' + (count !== 1 ? 's' : '') + ')</span><span>' + formatPrice(total) + '</span></div>' +
      '<div class="order-summary__row"><span>Envío</span><span style="color:var(--color-primary);font-weight:500">A confirmar</span></div>' +
      '<div class="order-summary__total"><span>Total</span><span>' + formatPrice(total) + '</span></div>' +
      '<a href="checkout.html" class="btn btn-primary btn-full mt-3">Proceder al pago →</a>' +
      '<a href="tienda.html" class="btn btn-ghost btn-full mt-1">Seguir comprando</a>' +
    '</div>';
  }
}

function renderCheckoutSummary(items) {
  var el = document.querySelector('#checkout-items-summary');
  if (!el) return;
  var subtotal = GaiaCart.getTotal();
  var discount = _loadDiscount();
  var discountAmount = Math.min(parseFloat(discount.amount || 0), subtotal);
  var total = Math.max(subtotal - discountAmount, 0);
  el.innerHTML = '<div class="order-summary">' +
    '<h3 class="order-summary__title">Tu pedido</h3>' +
    items.map(function (i) {
      return '<div class="order-summary__row"><span>' + i.name + (i.variant_label ? ' <small>(' + i.variant_label + ')</small>' : '') + ' × ' + i.quantity + '</span>' +
        '<span>' + formatPrice(i.price * i.quantity) + '</span></div>';
    }).join('') +
    '<div class="order-summary__row"><span>Subtotal</span><span>' + formatPrice(subtotal) + '</span></div>' +
    '<div class="order-summary__row"><span>Descuento</span><span style="color:#2e7d32">- ' + formatPrice(discountAmount) + '</span></div>' +
    '<div class="order-summary__total"><span>Nuevo total</span><span>' + formatPrice(total) + '</span></div>' +
    '<div class="form-group mt-2">' +
      '<label class="form-label" for="coupon-code">Código de descuento</label>' +
      '<div style="display:flex;gap:.5rem">' +
        '<input id="coupon-code" class="form-input" type="text" placeholder="Ej: GAIA10" value="' + (discount.code || '') + '">' +
        '<button type="button" class="btn btn-ghost" id="btn-apply-coupon">Aplicar</button>' +
      '</div>' +
      '<small id="coupon-status" style="display:block;margin-top:.35rem;color:var(--text-light)">' +
        (discount.code ? ('Cupón aplicado: ' + discount.code) : 'Ingresa tu cupón para calcular el descuento.') +
      '</small>' +
    '</div>' +
  '</div>';

  var applyBtn = document.querySelector('#btn-apply-coupon');
  var codeInput = document.querySelector('#coupon-code');
  var statusEl = document.querySelector('#coupon-status');

  if (applyBtn && codeInput) {
    applyBtn.addEventListener('click', async function () {
      var code = (codeInput.value || '').trim();
      if (!code) {
        _clearDiscount();
        renderCheckoutSummary(items);
        showToast('Cupón removido.', 'default');
        return;
      }
      applyBtn.disabled = true;
      applyBtn.textContent = 'Validando...';
      try {
        var resp = await GaiaAPI.validateCoupon(code, subtotal);
        if (!resp || !resp.valido) {
          _clearDiscount();
          if (statusEl) statusEl.textContent = (resp && resp.error) || 'Cupón inválido.';
          showToast((resp && resp.error) || 'Cupón inválido.', 'error');
          applyBtn.disabled = false;
          applyBtn.textContent = 'Aplicar';
          return;
        }
        _saveDiscount({ code: code, amount: parseFloat(resp.descuento_aplicado || 0) });
        renderCheckoutSummary(items);
        showToast('Cupón aplicado correctamente.', 'success');
      } catch (err) {
        _clearDiscount();
        if (statusEl) statusEl.textContent = err.message || 'No se pudo validar el cupón.';
        showToast(err.message || 'No se pudo validar el cupón.', 'error');
      } finally {
        applyBtn.disabled = false;
        applyBtn.textContent = 'Aplicar';
      }
    });
  }
}

function validateStep1(form) {
  var ok = true;
  ['customer_name', 'customer_phone'].forEach(function (name) {
    var el = form[name];
    if (!el || !el.value.trim()) { if (el) el.classList.add('error'); ok = false; }
    else { if (el) el.classList.remove('error'); }
  });
  if (!form.querySelector('input[name=delivery_method]:checked')) {
    showToast('Selecciona un método de entrega.', 'error'); return false;
  }
  var deliveryMethod = form.querySelector('input[name=delivery_method]:checked');
  if (deliveryMethod && deliveryMethod.value === 'delivery' && !form.querySelector('input[name=delivery_zone]:checked')) {
    showToast('Selecciona la zona de envío.', 'error'); return false;
  }
  if (!ok) showToast('Completa los campos obligatorios.', 'error');
  return ok;
}

function validateCheckoutForm(form) {
  var ok = true;
  ['customer_name', 'customer_phone'].forEach(function (name) {
    var el = form[name];
    if (!el || !el.value.trim()) { if (el) el.classList.add('error'); ok = false; }
    else { if (el) el.classList.remove('error'); }
  });
  if (!form.querySelector('input[name=delivery_method]:checked')) {
    showToast('Selecciona un método de entrega.', 'error'); return false;
  }
  var deliveryMethod = form.querySelector('input[name=delivery_method]:checked');
  if (deliveryMethod && deliveryMethod.value === 'delivery' && !form.querySelector('input[name=delivery_zone]:checked')) {
    showToast('Selecciona la zona de envío.', 'error'); return false;
  }
  if (!form.querySelector('input[name=payment_method]:checked')) {
    showToast('Selecciona un método de pago.', 'error'); return false;
  }
  if (!ok) showToast('Por favor completa los campos obligatorios.', 'error');
  return ok;
}

function _statusBadgeHtml(status) {
  var map = {
    pending:   { label: 'Pendiente',  color: '#e65c00', bg: 'rgba(230,92,0,.1)' },
    confirmed: { label: 'Confirmado', color: '#1976d2', bg: 'rgba(25,118,210,.1)' },
    delivered: { label: 'En camino',  color: '#7b1fa2', bg: 'rgba(123,31,162,.1)' },
    received:  { label: 'Recibido ✓', color: '#2e7d32', bg: 'rgba(46,125,50,.1)' },
    cancelled: { label: 'Cancelado',  color: '#c62828', bg: 'rgba(198,40,40,.1)' },
  };
  var s = map[status] || { label: status || 'Pendiente', color: '#666', bg: '#f5f5f5' };
  return '<span style="display:inline-block;padding:.25rem .85rem;border-radius:999px;font-size:.78rem;font-weight:700;' +
    'color:' + s.color + ';background:' + s.bg + ';letter-spacing:.05em;text-transform:uppercase;margin-top:.4rem">' + s.label + '</span>';
}

function renderOrderConfirmation(order, container) {
  if (!container) return;
  var orderItems = order.items || order.order_items || [];
  var waStore    = window._storeCache && window._storeCache.whatsapp && window._storeCache.whatsapp.replace(/\D/g, '');
  var waMsg      = encodeURIComponent('Hola Gaia Bolivia! Mi pedido #' + order.id + ' ya está pagado ✅');
  var waUrl      = waStore ? 'https://wa.me/' + waStore + '?text=' + waMsg : '#';
  var status     = order.status || 'pending';
  var canCancel  = ['pending', 'confirmed'].includes(status);
  var canReceive = ['confirmed', 'delivered'].includes(status);

  container.innerHTML = '<div class="conf-card">' +
    '<div class="conf-card__header">' +
      '<div class="conf-icon">' + (status === 'cancelled' ? '❌' : status === 'received' ? '🎉' : '✅') + '</div>' +
      '<h2>' + (status === 'cancelled' ? 'Pedido cancelado' : status === 'received'
        ? '¡Gracias, ' + (order.customer_name || '').split(' ')[0] + '!'
        : '¡Pedido recibido, ' + (order.customer_name || '').split(' ')[0] + '!') + '</h2>' +
      '<span class="order-id">Pedido #' + order.id + '</span>' +
      _statusBadgeHtml(status) +
    '</div>' +
    '<div class="conf-section">' +
      '<p class="conf-section__title">Detalles del pedido</p>' +
      '<div class="conf-row"><span>Cliente</span><strong>' + order.customer_name + '</strong></div>' +
      '<div class="conf-row"><span>Teléfono</span><strong>' + order.customer_phone + '</strong></div>' +
      '<div class="conf-row"><span>Entrega</span><strong>' + (order.delivery_method_display || order.delivery_method) + '</strong></div>' +
      '<div class="conf-row"><span>Pago</span><strong>' + (order.payment_method_display || order.payment_method) + '</strong></div>' +
      (order.customer_address ? '<div class="conf-row"><span>Dirección</span><strong>' + order.customer_address + '</strong></div>' : '') +
      (order.notes ? '<div class="conf-row"><span>Notas</span><strong>' + order.notes + '</strong></div>' : '') +
      '<div class="conf-row total"><span>Total a pagar</span><strong>' + formatPrice(order.total_amount) + '</strong></div>' +
    '</div>' +
    (orderItems.length ? '<div class="conf-section"><p class="conf-section__title">Productos del pedido</p>' +
      orderItems.map(function (item) {
        return '<div class="conf-item">' +
          '<img class="conf-item__img" src="' + (item.product_image || item.image || 'https://placehold.co/48x48/faf7f5/c78271?text=G') + '"' +
            ' alt="' + (item.product_name || item.name) + '" onerror="handleImgError(this)">' +
          '<div style="flex:1;min-width:0">' +
            '<p class="conf-item__name">' + (item.product_name || item.name) + '</p>' +
            '<p class="conf-item__meta">' + (item.variant_label ? item.variant_label + ' · ' : '') +
              'Cantidad: ' + item.quantity + ' · ' + formatPrice(item.unit_price || item.price) + ' c/u</p>' +
          '</div>' +
          '<span class="conf-item__price">' + formatPrice((item.unit_price || item.price) * item.quantity) + '</span>' +
        '</div>';
      }).join('') + '</div>' : '') +
    (status !== 'cancelled' && (order.qr_image || order.payment_method !== 'efectivo') ? '<div class="conf-section conf-qr">' +
      '<p class="conf-section__title">Instrucciones de pago</p>' +
      (order.qr_image ? '<img src="' + order.qr_image + '" alt="QR de pago"><p>Escanea el QR con tu app de <strong>' + (order.payment_method_display || order.payment_method) + '</strong></p>' : '') +
      '<div class="conf-amount">' + formatPrice(order.total_amount) + '</div>' +
      '<p style="margin-top:.5rem">Transfiere el monto exacto y luego sube tu comprobante.<br><small>Confirmaremos tu pedido en 1-2 horas.</small></p>' +
    '</div>' : (status !== 'cancelled' ? '<div class="conf-section" style="text-align:center"><p class="conf-section__title">Pago en efectivo</p>' +
      '<p>Pagarás <strong>' + formatPrice(order.total_amount) + '</strong> al recoger tu pedido.</p></div>' : '')) +
    (order.payment_method !== 'efectivo' && status !== 'cancelled' ? '<div class="conf-section" id="receipt-upload-section">' +
      '<p class="conf-section__title">📎 Comprobante de pago</p>' +
      (order.payment_receipt ? '<div style="text-align:center"><p style="color:#2e7d32;font-weight:600;margin-bottom:.75rem">✓ Comprobante enviado</p></div>'
        : '<div id="upload-area">' +
          '<input type="file" id="receipt-file" accept="image/*" class="sr-only">' +
          '<label for="receipt-file" class="upload-label"><span class="upload-icon">📎</span><span id="upload-text">Seleccionar imagen del comprobante</span></label>' +
          '<div id="receipt-preview" style="display:none;text-align:center;margin:.75rem 0">' +
            '<img id="receipt-preview-img" style="max-width:100%;max-height:220px;object-fit:contain;border:1px solid var(--color-border)">' +
          '</div>' +
          '<button class="btn btn-primary btn-full mt-2" id="upload-btn" disabled>Enviar comprobante</button>' +
        '</div>') +
    '</div>' : '') +
    (canCancel || canReceive ? '<div class="conf-section"><p class="conf-section__title">Acciones del pedido</p>' +
      '<div style="display:flex;gap:.75rem;flex-wrap:wrap">' +
        (canReceive ? '<button class="btn btn-primary" id="btn-confirm-received" onclick="handleConfirmReceived(' + order.id + ')">✅ Confirmar que lo recibí</button>' : '') +
        (canCancel ? '<button class="btn btn-outline" id="btn-cancel-order" style="border-color:#c62828;color:#c62828" onclick="handleCancelOrder(' + order.id + ')">✕ Cancelar pedido</button>' : '') +
      '</div>' +
    '</div>' : '') +
    '<div class="conf-section"><div class="conf-actions">' +
      '<a href="' + waUrl + '" target="_blank" rel="noopener" class="btn btn-lg btn-whatsapp">💬 Consultar por WhatsApp</a>' +
      '<button class="btn btn-outline" onclick="window.print()">🖨️ Imprimir</button>' +
      '<a href="tienda.html" class="btn btn-ghost">Seguir comprando</a>' +
    '</div></div>' +
  '</div>';
}

window.handleConfirmReceived = async function (orderId) {
  var btn = document.querySelector('#btn-confirm-received');
  if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }
  try {
    await GaiaAPI.confirmReceived(orderId);
    showToast('¡Pedido confirmado como recibido!', 'success');
    setTimeout(function () { location.reload(); }, 1200);
  } catch (err) {
    showToast(err.message || 'No se pudo confirmar. Intenta de nuevo.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '✅ Confirmar que lo recibí'; }
  }
};

window.handleCancelOrder = async function (orderId) {
  if (!confirm('¿Estás seguro de que deseas cancelar este pedido?')) return;
  var btn = document.querySelector('#btn-cancel-order');
  if (btn) { btn.disabled = true; btn.textContent = 'Cancelando...'; }
  try {
    await GaiaAPI.cancelOrder(orderId);
    showToast('Pedido cancelado.', 'default');
    setTimeout(function () { location.reload(); }, 1200);
  } catch (err) {
    showToast(err.message || 'No se pudo cancelar. Intenta de nuevo.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '✕ Cancelar pedido'; }
  }
};

function initReceiptUpload(orderId) {
  var fileInput   = document.querySelector('#receipt-file');
  var uploadBtn   = document.querySelector('#upload-btn');
  var uploadText  = document.querySelector('#upload-text');
  var previewWrap = document.querySelector('#receipt-preview');
  var previewImg  = document.querySelector('#receipt-preview-img');
  if (!fileInput || !uploadBtn) return;

  fileInput.addEventListener('change', function () {
    var file = fileInput.files[0];
    if (!file) return;
    if (uploadText) uploadText.textContent = file.name;
    uploadBtn.disabled = false;
    if (previewWrap && previewImg) {
      var reader = new FileReader();
      reader.onload = function (e) { previewImg.src = e.target.result; previewWrap.style.display = ''; };
      reader.readAsDataURL(file);
    }
  });

  uploadBtn.addEventListener('click', async function () {
    var file = fileInput.files[0];
    if (!file) return;
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:.5rem"><span class="spinner" style="width:16px;height:16px;margin:0;border-width:2px;border-color:rgba(255,255,255,.3);border-top-color:#fff"></span> Enviando...</span>';
    try {
      var updated = await GaiaAPI.uploadReceipt(orderId, file);
      showToast('Comprobante enviado correctamente.', 'success');
      var uploadArea = document.querySelector('#upload-area');
      if (uploadArea) {
        var receiptUrl = (updated && updated.payment_receipt) || (previewImg && previewImg.src) || '';
        uploadArea.innerHTML = '<p style="color:#2e7d32;font-weight:600;margin-bottom:.75rem">✓ Comprobante enviado — te contactaremos pronto.</p>' +
          (receiptUrl ? '<a href="' + receiptUrl + '" target="_blank" rel="noopener" style="display:inline-block;border:1px solid var(--color-border);overflow:hidden;max-width:280px"><img src="' + receiptUrl + '" style="width:100%;max-height:260px;object-fit:contain;display:block"></a>' : '');
      }
    } catch (err) {
      showToast(err.message, 'error');
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Enviar comprobante';
    }
  });
}

// ── Zoom imagen (legacy, producto.html viejo) ──────────────────────────────────
window.zoomImg = function (src, alt) {
  if (!src) return;
  var overlay = document.createElement('div');
  overlay.className = 'img-zoom-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.innerHTML = '<span class="img-zoom-overlay__close" onclick="this.parentElement.remove()" aria-label="Cerrar">✕</span>' +
    '<img src="' + src + '" alt="' + (alt || '') + '" style="max-width:min(92vw,720px);max-height:85vh;object-fit:contain">';
  overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
  var onKey = function (e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
};

window.switchImg = function (src, thumbEl) {
  var mainImg = document.querySelector('#main-product-img');
  if (mainImg) mainImg.src = src;
  document.querySelectorAll('.thumb').forEach(function (t) { t.classList.remove('active'); });
  if (thumbEl) thumbEl.classList.add('active');
};

// ── Bootstrap ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  initNavbar();
  initMobileNav();
  initNavDropdowns();
  initSiteSearch();
  _initStoreLinks();

  var page = document.body.dataset.page;
  if (page === 'home')         initHome();
  if (page === 'tienda')       initTienda();
  if (page === 'producto')     initProducto();
  if (page === 'carrito')      initCarrito();
  if (page === 'checkout')     initCheckout();
  if (page === 'confirmacion') initConfirmacion();
});

async function _initStoreLinks() {
  try {
    var store = await GaiaAPI.getStore();
    window._storeCache = store;
    if (store.whatsapp) {
      var wa = 'https://wa.me/' + store.whatsapp.replace(/\D/g, '');
      document.querySelectorAll('[data-whatsapp]').forEach(function (b) { b.href = wa; });
      var fab = document.querySelector('.whatsapp-fab');
      if (fab) fab.style.display = 'flex';
    }
    if (store.instagram) document.querySelectorAll('[data-instagram]').forEach(function (a) { a.href = store.instagram; });
    if (store.facebook)  document.querySelectorAll('[data-facebook]').forEach(function (a) { a.href = store.facebook; });
    if (store.tiktok)    document.querySelectorAll('[data-tiktok]').forEach(function (a) { a.href = store.tiktok; });
  } catch (_) {}
}
