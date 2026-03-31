/**
 * app.js — Inicialización por página y lógica de UI compartida
 */

// ── Navbar ─────────────────────────────────────────────────────────────────────

function initNavbar() {
  // Badge del carrito
  const badge = document.querySelector('#cart-badge');
  if (badge) {
    badge.textContent = GaiaCart.getCount();
    badge.style.display = GaiaCart.getCount() ? 'flex' : 'none';
  }

  window.addEventListener('cart:updated', (e) => {
    if (!badge) return;
    badge.textContent = e.detail;
    badge.style.display = e.detail > 0 ? 'flex' : 'none';
  });

  // Hamburger
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
    });
  }

  // Marcar enlace activo
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar__nav a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ── Toast ──────────────────────────────────────────────────────────────────────

function showToast(message, type = 'default', duration = 3000) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = `toast ${type}`;

  // force reflow
  void el.offsetWidth;
  el.classList.add('show');

  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), duration);
}

window.showToast = showToast;

// ── Utilidades ─────────────────────────────────────────────────────────────────

function formatPrice(amount) {
  return `Bs. ${parseFloat(amount).toFixed(2)}`;
}
window.formatPrice = formatPrice;

function getParam(key) {
  return new URLSearchParams(location.search).get(key);
}
window.getParam = getParam;

/** Reemplaza src de img por placeholder si hay error de carga */
function handleImgError(img) {
  img.onerror = null;
  img.src = `https://placehold.co/400x400/e8d5b0/9e7d4a?text=Gaia`;
}
window.handleImgError = handleImgError;

function imgSrc(imgObj) {
  return imgObj?.image || null;
}
window.imgSrc = imgSrc;

// ── Inicializadores por página ─────────────────────────────────────────────────

/** HOME (index.html) */
async function initHome() {
  // ── Skeletons para productos ──────────────────────────────────────────────
  const prodGrid = document.querySelector('#featured-products');
  if (prodGrid) {
    prodGrid.innerHTML = Array(4).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line short"></div>
          <div class="skeleton skeleton-line price"></div>
        </div>
      </div>`).join('');
  }

  // ── Info de la tienda ─────────────────────────────────────────────────────
  try {
    const store = await GaiaAPI.getStore();

    const descEl = document.querySelector('#store-description');
    if (descEl && store.description) descEl.textContent = store.description;

    if (store.whatsapp) {
      const waUrl = `https://wa.me/${store.whatsapp.replace(/\D/g, '')}`;
      document.querySelectorAll('[data-whatsapp]').forEach(b => { b.href = waUrl; });

      // Mostrar FAB y botón del banner
      const fab = document.querySelector('.whatsapp-fab');
      if (fab) fab.style.display = 'flex';

      const promoWa = document.querySelector('#promo-whatsapp');
      if (promoWa) promoWa.style.display = 'inline-flex';
    }

    // Redes sociales
    if (store.instagram) {
      document.querySelectorAll('[data-instagram]').forEach(a => { a.href = store.instagram; });
    }
    if (store.facebook) {
      document.querySelectorAll('[data-facebook]').forEach(a => { a.href = store.facebook; });
    }
    if (store.tiktok) {
      document.querySelectorAll('[data-tiktok]').forEach(a => { a.href = store.tiktok; });
    }
  } catch (_) {}

  // ── Categorías destacadas ─────────────────────────────────────────────────
  const catGrid = document.querySelector('#categories-grid');
  try {
    const cats = await GaiaAPI.getCategories();
    if (catGrid) {
      if (cats.length) {
        catGrid.innerHTML = cats.slice(0, 4).map(c => `
          <a href="tienda.html?category=${c.id}" class="category-card">
            <div class="category-card__icon">${categoryIcon(c.name)}</div>
            <p class="category-card__name">${c.name}</p>
          </a>`).join('');
      } else {
        catGrid.innerHTML = '<p class="text-center" style="grid-column:1/-1;color:var(--text-light)">Sin categorías disponibles.</p>';
      }
    }
  } catch (_) {
    if (catGrid) catGrid.innerHTML = '<p class="text-center" style="grid-column:1/-1;color:var(--text-light)">No se pudieron cargar las categorías.</p>';
  }

  // ── Productos destacados ──────────────────────────────────────────────────
  try {
    const data = await GaiaAPI.getProducts({ page: 1 });
    if (prodGrid && data.results) {
      prodGrid.innerHTML = data.results.length
        ? data.results.slice(0, 4).map(renderProductCard).join('')
        : '<p class="text-center" style="color:var(--text-light)">No hay productos disponibles aún.</p>';
    }
  } catch (_) {
    if (prodGrid) prodGrid.innerHTML = '<p class="text-center" style="color:var(--text-light)">No se pudieron cargar los productos.</p>';
  }
}

/** Devuelve un emoji representativo según el nombre de la categoría */
function categoryIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('crema') || n.includes('hidrat'))   return '🧴';
  if (n.includes('labial') || n.includes('labios'))  return '💄';
  if (n.includes('cabello') || n.includes('pelo'))   return '💇';
  if (n.includes('facial') || n.includes('rostro'))  return '✨';
  if (n.includes('perfume') || n.includes('aroma'))  return '🌸';
  if (n.includes('ojos') || n.includes('maquillaje'))return '👁️';
  if (n.includes('uña') || n.includes('esmalte'))    return '💅';
  if (n.includes('cuerpo') || n.includes('body'))    return '🛁';
  if (n.includes('natural') || n.includes('planta')) return '🌿';
  if (n.includes('solar') || n.includes('protec'))   return '☀️';
  return '🌟';
}

/** TIENDA (tienda.html) */
async function initTienda() {
  const grid         = document.querySelector('#products-grid');
  const catList      = document.querySelector('#category-list');
  const searchInput  = document.querySelector('#search-input');
  const countEl      = document.querySelector('#products-count');
  const paginationEl = document.querySelector('#pagination');
  const sortSelect   = document.querySelector('#sort-select');
  const clearBtn     = document.querySelector('#clear-filters');
  const breadcrumbCat= document.querySelector('#breadcrumb-cat');
  const catSep       = document.querySelector('#cat-sep');
  const filterToggle = document.querySelector('#filter-toggle');
  const sidebarCard  = document.querySelector('#sidebar-card');

  let currentPage     = parseInt(getParam('page'))    || 1;
  let currentCategory = getParam('category')          || '';
  let currentSearch   = getParam('search')            || '';
  let currentOrdering = getParam('ordering')          || '';
  let _allCats        = [];

  if (searchInput && currentSearch)   searchInput.value  = currentSearch;
  if (sortSelect  && currentOrdering) sortSelect.value   = currentOrdering;

  // Mobile sidebar toggle
  if (filterToggle && sidebarCard) {
    filterToggle.addEventListener('click', () => {
      const open = sidebarCard.classList.toggle('open');
      filterToggle.classList.toggle('open', open);
      filterToggle.setAttribute('aria-expanded', open);
    });
  }

  function syncUrl() {
    const p = new URLSearchParams();
    if (currentCategory) p.set('category', currentCategory);
    if (currentSearch)   p.set('search',   currentSearch);
    if (currentOrdering) p.set('ordering', currentOrdering);
    if (currentPage > 1) p.set('page',     currentPage);
    const qs = p.toString();
    history.replaceState({}, '', qs ? `?${qs}` : location.pathname);
  }

  function showSkeletons(n = 6) {
    if (!grid) return;
    grid.innerHTML = Array(n).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line short"></div>
          <div class="skeleton skeleton-line price"></div>
          <div class="skeleton skeleton-btn"></div>
        </div>
      </div>`).join('');
  }

  function updateBreadcrumb() {
    if (!breadcrumbCat || !catSep) return;
    if (currentCategory) {
      const found = _allCats.find(c => c.id == currentCategory);
      breadcrumbCat.textContent = found?.name || '';
      catSep.style.display = '';
    } else {
      breadcrumbCat.textContent = '';
      catSep.style.display = 'none';
    }
  }

  async function loadProducts() {
    showSkeletons();
    const orderMap = { price_asc: 'price', price_desc: '-price', '-id': '-id' };
    const apiOrdering = orderMap[currentOrdering] || currentOrdering || undefined;

    try {
      const data = await GaiaAPI.getProducts({
        page:     currentPage,
        category: currentCategory || undefined,
        search:   currentSearch   || undefined,
        ordering: apiOrdering,
      });

      let results = data.results || [];
      // Client-side sort fallback (affects current page only)
      if (currentOrdering === 'price_asc')  results = [...results].sort((a, b) => a.price - b.price);
      if (currentOrdering === 'price_desc') results = [...results].sort((a, b) => b.price - a.price);
      if (currentOrdering === '-id')        results = [...results].sort((a, b) => b.id - a.id);

      if (grid) {
        grid.innerHTML = results.length
          ? results.map(renderProductCard).join('')
          : `<div class="empty-state" style="grid-column:1/-1">
               <div class="empty-state__icon">🌿</div>
               <h3>Sin resultados</h3>
               <p>Prueba con otro término o categoría.</p>
             </div>`;
      }

      if (countEl) {
        const from = (currentPage - 1) * 12 + 1;
        const to   = (currentPage - 1) * 12 + results.length;
        countEl.innerHTML = data.count
          ? `Mostrando <strong>${from}–${to}</strong> de <strong>${data.count}</strong> producto${data.count !== 1 ? 's' : ''}`
          : '';
      }

      renderPagination(paginationEl, data, currentPage, (p) => {
        currentPage = p;
        syncUrl();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadProducts();
      });
    } catch (e) {
      if (grid) grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">⚠️</div>
          <h3>Error al cargar productos</h3>
          <p>${e.message}</p>
        </div>`;
    }
  }

  async function loadCategories() {
    try {
      _allCats = await GaiaAPI.getCategories();
      if (!catList) return;

      catList.innerHTML = `
        <li><label><input type="radio" name="cat" value="" ${!currentCategory ? 'checked' : ''}> Todas</label></li>
        ${_allCats.map(c => `
          <li>
            <label>
              <input type="radio" name="cat" value="${c.id}" ${currentCategory == c.id ? 'checked' : ''}>
              ${c.name}
              ${c.product_count != null ? `<span class="cat-count">(${c.product_count})</span>` : ''}
            </label>
          </li>`).join('')}`;

      catList.addEventListener('change', e => {
        if (e.target.name !== 'cat') return;
        currentCategory = e.target.value;
        currentPage = 1;
        updateBreadcrumb();
        syncUrl();
        loadProducts();
      });

      updateBreadcrumb();
    } catch (_) {}
  }

  // Search
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        currentSearch = searchInput.value.trim();
        currentPage = 1;
        syncUrl();
        loadProducts();
      }, 380);
    });
  }

  // Sort
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentOrdering = sortSelect.value;
      currentPage = 1;
      syncUrl();
      loadProducts();
    });
  }

  // Clear filters
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      currentCategory = '';
      currentSearch   = '';
      currentOrdering = '';
      currentPage     = 1;
      if (searchInput) searchInput.value = '';
      if (sortSelect)  sortSelect.value  = '';
      if (catList) {
        const allRadio = catList.querySelector('input[value=""]');
        if (allRadio) allRadio.checked = true;
      }
      updateBreadcrumb();
      syncUrl();
      loadProducts();
    });
  }

  await Promise.all([loadCategories(), loadProducts()]);
}

/** PRODUCTO DETALLE (producto.html) */
async function initProducto() {
  const id = getParam('id');
  if (!id) { location.href = 'tienda.html'; return; }

  const container = document.querySelector('#product-detail');
  if (!container) return;

  container.innerHTML = '<div class="spinner"></div>';

  try {
    const p = await GaiaAPI.getProduct(id);
    document.title = `${p.name} — Gaia Bolivia Beauty`;
    const bc = document.querySelector('#breadcrumb-name');
    if (bc) bc.textContent = p.name;
    renderProductDetail(p, container);
    if (p.category?.id) loadRelatedProducts(p.category.id, p.id);
  } catch (e) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">😕</div>
        <h3>Producto no encontrado</h3>
        <p>${e.message}</p>
        <a href="tienda.html" class="btn btn-primary mt-3">Volver a la tienda</a>
      </div>`;
  }
}

/** CARRITO (carrito.html) */
function initCarrito() {
  renderCartPage();

  window.addEventListener('cart:updated', () => renderCartPage());
}

/** CHECKOUT (checkout.html) */
function initCheckout() {
  const items = GaiaCart.getItems();
  if (!items.length) { location.href = 'carrito.html'; return; }

  renderCheckoutSummary(items);

  const form    = document.querySelector('#checkout-form');
  if (!form) return;

  const panel1  = document.querySelector('#step-panel-1');
  const panel2  = document.querySelector('#step-panel-2');
  const btnNext = document.querySelector('#btn-next');
  const btnBack = document.querySelector('#btn-back');

  // ── Wizard navigation ─────────────────────────────────────────────────────
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (!validateStep1(form)) return;
      panel1.style.display = 'none';
      panel2.style.display = '';
      // Advance step indicator
      const stepDatos = document.querySelector('#step-datos');
      const stepPago  = document.querySelector('#step-pago');
      const stepLine2 = document.querySelector('#step-line-2');
      if (stepDatos) { stepDatos.classList.remove('active'); stepDatos.classList.add('done'); stepDatos.querySelector('.step__dot').textContent = '✓'; }
      if (stepLine2) stepLine2.classList.add('done');
      if (stepPago)  stepPago.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', () => {
      panel2.style.display = 'none';
      panel1.style.display = '';
      const stepDatos = document.querySelector('#step-datos');
      const stepPago  = document.querySelector('#step-pago');
      const stepLine2 = document.querySelector('#step-line-2');
      if (stepDatos) { stepDatos.classList.add('active'); stepDatos.classList.remove('done'); stepDatos.querySelector('.step__dot').textContent = '2'; }
      if (stepLine2) stepLine2.classList.remove('done');
      if (stepPago)  stepPago.classList.remove('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Delivery: show/hide address ───────────────────────────────────────────
  form.querySelectorAll('input[name=delivery_method]').forEach(radio => {
    radio.addEventListener('change', () => {
      form.querySelectorAll('input[name=delivery_method]').forEach(r =>
        r.closest('.delivery-card')?.classList.remove('selected'));
      radio.closest('.delivery-card')?.classList.add('selected');
      const ag = document.querySelector('#address-group');
      if (ag) ag.classList.toggle('show', radio.value === 'delivery');
    });
  });

  // ── Payment: highlight card + show QR preview ─────────────────────────────
  form.querySelectorAll('input[name=payment_method]').forEach(radio => {
    radio.addEventListener('change', () => {
      form.querySelectorAll('input[name=payment_method]').forEach(r =>
        r.closest('.payment-card')?.classList.remove('selected'));
      radio.closest('.payment-card')?.classList.add('selected');

      const qrPreview = document.querySelector('#payment-qr-preview');
      const qrName    = document.querySelector('#qr-method-name');
      if (qrPreview) {
        const showQR = ['tigo_money', 'banco_union'].includes(radio.value);
        qrPreview.style.display = showQR ? '' : 'none';
        if (qrName) qrName.textContent = radio.value === 'tigo_money' ? 'Tigo Money' : 'Banco Unión';
      }
    });
  });

  // ── Form submit ───────────────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateCheckoutForm(form)) return;

    const submitBtn = document.querySelector('#btn-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:.5rem"><span class="spinner" style="width:18px;height:18px;margin:0;border-width:2px;border-color:rgba(255,255,255,.3);border-top-color:#fff"></span> Procesando...</span>';
    }

    const data = {
      customer_name:    form.customer_name.value.trim(),
      customer_phone:   form.customer_phone.value.trim(),
      customer_email:   form.customer_email?.value.trim() || '',
      customer_address: form.customer_address?.value.trim() || '',
      delivery_method:  form.delivery_method.value,
      payment_method:   form.payment_method.value,
      notes:            form.notes?.value.trim() || '',
      items:            GaiaCart.toCheckoutItems(),
    };

    try {
      const order = await GaiaAPI.checkout(data);
      GaiaCart.clearCart();
      location.href = `confirmacion.html?order_id=${order.id}`;
    } catch (err) {
      showToast(err.message, 'error', 5000);
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Confirmar Pedido →'; }
    }
  });
}

/** CONFIRMACIÓN (confirmacion.html) */
async function initConfirmacion() {
  const orderId = getParam('order_id');
  if (!orderId) { location.href = 'index.html'; return; }

  const container = document.querySelector('#order-detail');
  if (container) container.innerHTML = '<div class="spinner"></div>';

  try {
    const order = await GaiaAPI.getOrder(orderId);
    renderOrderConfirmation(order, container);
    initReceiptUpload(orderId);
  } catch (e) {
    if (container) container.innerHTML = `<p class="text-center">${e.message}</p>`;
  }
}

// ── Render helpers ─────────────────────────────────────────────────────────────

function renderProductCard(p) {
  const img = p.images?.[0]?.image || null;
  const hasVariants = p.variants?.length > 0;
  return `
    <article class="product-card" onclick="location.href='producto.html?id=${p.id}'"
      role="button" aria-label="Ver ${p.name}">
      <div class="product-card__img-wrap">
        ${img
          ? `<img src="${img}" alt="${p.name}" loading="lazy" onerror="handleImgError(this)">`
          : `<img src="https://placehold.co/400x400/e8d5b0/9e7d4a?text=Gaia" alt="${p.name}">`}
        ${p.category ? `<span class="product-card__badge">${p.category.name}</span>` : ''}
      </div>
      <div class="product-card__body">
        ${p.category ? `<p class="product-card__category">${p.category.name}</p>` : ''}
        <h3 class="product-card__name">${p.name}</h3>
        <p class="product-card__price">${formatPrice(p.price)}${hasVariants ? ' <span>· Varias opciones</span>' : ''}</p>
      </div>
      <div class="product-card__footer">
        <a href="producto.html?id=${p.id}" class="btn btn-primary btn-sm btn-full"
          onclick="event.stopPropagation()">Ver producto</a>
      </div>
    </article>`;
}

function quickAddToCart(id, name, price, img) {
  GaiaCart.addItem({ id, name, price, images: img ? [{ image: img }] : [] }, null, 1);
  showToast(`${name} agregado al carrito`, 'success');
}
window.quickAddToCart = quickAddToCart;

function renderPagination(el, data, currentPage, onPageChange) {
  if (!el) return;
  window._paginationCb = onPageChange;
  const total = Math.ceil(data.count / 12);
  if (total <= 1) { el.innerHTML = ''; return; }

  function pageRange(cur, tot) {
    if (tot <= 7) return Array.from({ length: tot }, (_, i) => i + 1);
    if (cur <= 4)       return [1, 2, 3, 4, 5, '…', tot];
    if (cur >= tot - 3) return [1, '…', tot-4, tot-3, tot-2, tot-1, tot];
    return [1, '…', cur-1, cur, cur+1, '…', tot];
  }

  const pages = pageRange(currentPage, total);
  let html = '<div class="pagination">';
  html += `<button class="page-btn" onclick="_paginationCb(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} aria-label="Anterior">‹</button>`;
  for (const p of pages) {
    if (p === '…') {
      html += '<span class="page-ellipsis">…</span>';
    } else {
      html += `<button class="page-btn${p === currentPage ? ' active' : ''}" onclick="_paginationCb(${p})" aria-label="Página ${p}">${p}</button>`;
    }
  }
  html += `<button class="page-btn" onclick="_paginationCb(${currentPage + 1})" ${currentPage === total ? 'disabled' : ''} aria-label="Siguiente">›</button>`;
  html += '</div>';
  el.innerHTML = html;
}

function renderProductDetail(p, container) {
  const imgs    = p.images || [];
  const mainImg = imgs[0]?.image || null;
  const variants = p.variants || [];

  const hasSizes  = variants.some(v => v.size);
  const hasColors = variants.some(v => v.color);
  const hasVars   = variants.length > 0;

  // Build variant selector HTML
  let variantHtml = '';
  if (hasVars) {
    if (hasSizes) {
      const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
      variantHtml += `
        <div class="variant-group">
          <p class="form-label" style="margin-bottom:.45rem">
            Talla: <span id="v-size-label" style="color:var(--primary);font-weight:600"></span>
          </p>
          <div class="size-btns">
            ${sizes.map(s => {
              const inStock = variants.some(v => v.size === s && v.stock > 0);
              return `<button class="size-btn${!inStock ? ' oos' : ''}"
                data-attr="size" data-val="${s}"
                onclick="selectVariantAttr('size','${s}',this)">${s}</button>`;
            }).join('')}
          </div>
        </div>`;
    }
    if (hasColors) {
      const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
      variantHtml += `
        <div class="variant-group">
          <p class="form-label" style="margin-bottom:.45rem">
            Color: <span id="v-color-label" style="color:var(--primary);font-weight:600"></span>
          </p>
          <div class="color-btns">
            ${colors.map(c => `
              <button class="color-btn" data-attr="color" data-val="${c}"
                style="background:${colorNameToHex(c)}"
                onclick="selectVariantAttr('color','${c}',this)"
                title="${c}" aria-label="${c}"></button>`).join('')}
          </div>
        </div>`;
    }
    if (!hasSizes && !hasColors) {
      variantHtml = `
        <div class="variant-group">
          <p class="form-label" style="margin-bottom:.45rem">Variante:</p>
          <div class="variant-btns">
            ${variants.map(v => `
              <button class="pill" data-variant-id="${v.id}"
                data-size="${v.size||''}" data-color="${v.color||''}"
                onclick="selectVariant(this)">
                ${[v.size, v.color].filter(Boolean).join(' / ') || `Opción ${v.id}`}
                ${v.stock <= 0 ? ' <small style="color:#f44336">(sin stock)</small>' : ''}
              </button>`).join('')}
          </div>
        </div>`;
    }
    variantHtml += `<p id="stock-info" style="display:none;font-size:.82rem;margin:.4rem 0 .75rem"></p>`;
  }

  container.innerHTML = `
    <div class="product-detail">

      <!-- ── Gallery ── -->
      <div class="product-detail__gallery">
        <div class="product-detail__main-img" onclick="zoomImg('${mainImg || ''}','${p.name}')">
          <img id="main-product-img"
            src="${mainImg || 'https://placehold.co/600x600/e8d5b0/9e7d4a?text=Gaia'}"
            alt="${p.name}" onerror="handleImgError(this)">
        </div>
        ${imgs.length > 1 ? `
          <div class="product-detail__thumbs">
            ${imgs.map((im, i) => `
              <img src="${im.image}" alt="${p.name} ${i+1}"
                class="thumb${i === 0 ? ' active' : ''}"
                onclick="switchImg('${im.image}', this)"
                onerror="handleImgError(this)">`).join('')}
          </div>` : ''}
      </div>

      <!-- ── Info ── -->
      <div class="product-detail__info">
        ${p.category ? `<span class="product-card__badge" style="position:static;display:inline-block;margin-bottom:.75rem">${p.category.name}</span>` : ''}
        <h1 style="font-size:clamp(1.6rem,4vw,2.2rem);margin-bottom:.3rem">${p.name}</h1>
        <p class="product-detail__price">${formatPrice(p.price)}</p>
        ${p.description ? `<p class="product-detail__desc">${p.description}</p>` : ''}

        ${variantHtml}

        <!-- Cantidad -->
        <div style="margin:1.25rem 0">
          <p class="form-label" style="margin-bottom:.45rem">Cantidad:</p>
          <div class="cart-item__qty">
            <button class="qty-btn" onclick="changeDetailQty(-1)">−</button>
            <span class="qty-value" id="detail-qty" data-max="999">1</span>
            <button class="qty-btn" onclick="changeDetailQty(1)">+</button>
          </div>
        </div>

        <!-- Acciones -->
        <div style="display:flex;gap:.75rem;flex-wrap:wrap">
          <button class="btn btn-primary btn-lg" id="add-to-cart-btn"
            ${hasVars ? 'disabled' : ''}
            onclick="addDetailToCart()">
            🛒 Agregar al carrito
          </button>
          <button class="btn btn-secondary btn-lg" id="buy-now-btn"
            ${hasVars ? 'disabled' : ''}
            onclick="buyNow()">
            Comprar ahora
          </button>
        </div>
        ${hasVars ? '<p style="font-size:.78rem;color:var(--text-light);margin-top:.6rem">Selecciona una variante para continuar</p>' : ''}
      </div>

    </div>`;

  window._currentProduct  = p;
  window._selectedVariant = null;
  window._selectedSize    = null;
  window._selectedColor   = null;
  window._detailQty       = 1;
}

window.switchImg = function(src, thumbEl) {
  document.querySelector('#main-product-img').src = src;
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
};

window.selectVariant = function(btn) {
  document.querySelectorAll('.variant-btns .pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  window._selectedVariant = {
    id:    btn.dataset.variantId,
    size:  btn.dataset.size,
    color: btn.dataset.color,
  };
  const v = window._currentProduct?.variants?.find(v => v.id == btn.dataset.variantId);
  _applyVariantStock(v);
};

/** Selecciona atributo de variante (talla o color) */
window.selectVariantAttr = function(attr, val, btn) {
  btn.closest('.size-btns, .color-btns')
     .querySelectorAll('button')
     .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (attr === 'size') {
    window._selectedSize = val;
    const lbl = document.querySelector('#v-size-label');
    if (lbl) lbl.textContent = val;
  } else {
    window._selectedColor = val;
    const lbl = document.querySelector('#v-color-label');
    if (lbl) lbl.textContent = val;
  }
  _resolveVariant();
};

function _resolveVariant() {
  const p = window._currentProduct;
  if (!p?.variants?.length) return;

  const hasSizes  = p.variants.some(v => v.size);
  const hasColors = p.variants.some(v => v.color);
  let found = null;

  if (hasSizes && hasColors) {
    if (window._selectedSize && window._selectedColor) {
      found = p.variants.find(v => v.size === window._selectedSize && v.color === window._selectedColor);
    }
  } else if (hasSizes) {
    found = window._selectedSize ? p.variants.find(v => v.size === window._selectedSize) : null;
  } else {
    found = window._selectedColor ? p.variants.find(v => v.color === window._selectedColor) : null;
  }

  window._selectedVariant = found ? { id: found.id, size: found.size, color: found.color } : null;

  const hasSelection = hasSizes && hasColors
    ? !!(window._selectedSize && window._selectedColor)
    : !!(window._selectedSize || window._selectedColor);

  if (!hasSelection) return;

  if (found) {
    _applyVariantStock(found);
  } else {
    const stockEl = document.querySelector('#stock-info');
    if (stockEl) { stockEl.textContent = 'Combinación no disponible'; stockEl.style.color = '#f44336'; stockEl.style.display = ''; }
    const addBtn = document.querySelector('#add-to-cart-btn');
    const buyBtn = document.querySelector('#buy-now-btn');
    if (addBtn) addBtn.disabled = true;
    if (buyBtn) buyBtn.disabled = true;
  }
}

function _applyVariantStock(v) {
  if (!v) return;
  const inStock = v.stock > 0;
  const stockEl = document.querySelector('#stock-info');
  const addBtn  = document.querySelector('#add-to-cart-btn');
  const buyBtn  = document.querySelector('#buy-now-btn');
  const qtyEl   = document.querySelector('#detail-qty');

  if (stockEl) {
    stockEl.textContent = inStock
      ? `${v.stock} disponible${v.stock !== 1 ? 's' : ''}`
      : 'Sin stock';
    stockEl.style.color = !inStock ? '#f44336' : v.stock <= 5 ? '#e65c00' : '#4caf50';
    stockEl.style.display = '';
  }
  if (addBtn) addBtn.disabled = !inStock;
  if (buyBtn) buyBtn.disabled = !inStock;
  if (qtyEl && inStock) {
    window._detailQty = 1;
    qtyEl.textContent  = 1;
    qtyEl.dataset.max  = v.stock;
  }
}

/** Mapea nombre de color a hex */
function colorNameToHex(name) {
  const map = {
    rojo:'#e53935', red:'#e53935', azul:'#1e88e5', blue:'#1e88e5',
    verde:'#43a047', green:'#43a047', amarillo:'#fdd835', yellow:'#fdd835',
    negro:'#212121', black:'#212121', blanco:'#f5f5f5', white:'#f5f5f5',
    rosado:'#e91e8c', rosa:'#f48fb1', pink:'#f48fb1',
    naranja:'#fb8c00', orange:'#fb8c00', morado:'#8e24aa', violeta:'#7b1fa2',
    purple:'#7b1fa2', dorado:'#c8a96e', gold:'#c8a96e',
    plateado:'#9e9e9e', silver:'#9e9e9e', beige:'#d7c4a0',
    cafe:'#795548', marrón:'#795548', brown:'#795548', coral:'#ff7043',
    turquesa:'#00acc1', teal:'#00897b', celeste:'#4fc3f7',
  };
  return map[(name || '').toLowerCase().trim()] || '#c8a96e';
}
window.colorNameToHex = colorNameToHex;

/** Zoom de imagen */
window.zoomImg = function(src, alt) {
  if (!src) return;
  const overlay = document.createElement('div');
  overlay.className = 'img-zoom-overlay';
  overlay.innerHTML = `
    <span class="img-zoom-overlay__close" onclick="this.parentElement.remove()" aria-label="Cerrar">✕</span>
    <img src="${src}" alt="${alt || ''}">`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
};

/** Cargar productos relacionados */
async function loadRelatedProducts(categoryId, excludeId) {
  const section = document.querySelector('#related-section');
  const relGrid = document.querySelector('#related-grid');
  if (!section || !relGrid) return;
  try {
    const data    = await GaiaAPI.getProducts({ category: categoryId, page: 1 });
    const related = (data.results || []).filter(pr => pr.id != excludeId).slice(0, 4);
    if (!related.length) return;
    section.style.display = '';
    relGrid.innerHTML = related.map(renderProductCard).join('');
  } catch (_) {}
}

/** Comprar ahora: agrega al carrito y va directo a checkout */
window.buyNow = function() {
  const p = window._currentProduct;
  if (!p) return;
  GaiaCart.addItem(p, window._selectedVariant, window._detailQty || 1);
  location.href = 'checkout.html';
};

window.changeDetailQty = function(delta) {
  const el  = document.querySelector('#detail-qty');
  const max = parseInt(el?.dataset.max) || 999;
  window._detailQty = Math.min(max, Math.max(1, (window._detailQty || 1) + delta));
  if (el) el.textContent = window._detailQty;
};

window.addDetailToCart = function() {
  const p = window._currentProduct;
  if (!p) return;
  GaiaCart.addItem(p, window._selectedVariant, window._detailQty || 1);
  showToast(`${p.name} agregado al carrito`, 'success');
};

function renderCartPage() {
  const container = document.querySelector('#cart-items');
  const summary   = document.querySelector('#cart-summary');
  const items     = GaiaCart.getItems();

  if (!container) return;

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state" style="padding:5rem 1rem">
        <div class="empty-state__icon">🛒</div>
        <h3>Tu carrito está vacío</h3>
        <p>Explora nuestra tienda y agrega productos que te gusten.</p>
        <a href="tienda.html" class="btn btn-primary mt-3">Ir a la tienda</a>
      </div>`;
    if (summary) summary.innerHTML = '';
    return;
  }

  // Table header + rows
  container.innerHTML = `
    <div class="cart-table">
      <div class="cart-table-head">
        <span></span>
        <span>Producto</span>
        <span style="text-align:center">Precio</span>
        <span style="text-align:center">Cantidad</span>
        <span style="text-align:right">Subtotal</span>
        <span></span>
      </div>
      ${items.map(item => `
        <div class="cart-row" data-id="${item.id}">
          <div class="cart-row__img">
            <img src="${item.image || 'https://placehold.co/80x80/e8d5b0/9e7d4a?text=G'}"
              alt="${item.name}" onerror="handleImgError(this)">
          </div>
          <div class="cart-row__info">
            <p class="cart-row__name">${item.name}</p>
            ${item.variant_label ? `<p class="cart-row__variant">${item.variant_label}</p>` : ''}
          </div>
          <div class="cart-row__price">${formatPrice(item.price)}</div>
          <div class="cart-row__qty">
            <button class="qty-btn" onclick="GaiaCart.updateQty('${item.id}', ${item.quantity - 1})" aria-label="Quitar uno">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" onclick="GaiaCart.updateQty('${item.id}', ${item.quantity + 1})" aria-label="Agregar uno">+</button>
          </div>
          <div class="cart-row__subtotal">${formatPrice(item.price * item.quantity)}</div>
          <div class="cart-row__remove">
            <button class="cart-item__remove" onclick="GaiaCart.removeItem('${item.id}')"
              title="Eliminar" aria-label="Eliminar ${item.name}">✕</button>
          </div>
        </div>`).join('')}
    </div>`;

  if (summary) {
    const total = GaiaCart.getTotal();
    const count = GaiaCart.getCount();
    summary.innerHTML = `
      <div class="order-summary">
        <h3 class="order-summary__title">Resumen del pedido</h3>
        <div class="order-summary__row">
          <span>Subtotal (${count} producto${count !== 1 ? 's' : ''})</span>
          <span>${formatPrice(total)}</span>
        </div>
        <div class="order-summary__row">
          <span>Envío</span>
          <span style="color:var(--primary);font-weight:500">A confirmar</span>
        </div>
        <div class="order-summary__total">
          <span>Total</span>
          <span>${formatPrice(total)}</span>
        </div>
        <a href="checkout.html" class="btn btn-primary btn-full mt-3">
          Proceder al pago →
        </a>
        <a href="tienda.html" class="btn btn-ghost btn-full mt-1">
          Seguir comprando
        </a>
      </div>`;
  }
}

function renderCheckoutSummary(items) {
  const el = document.querySelector('#checkout-items-summary');
  if (!el) return;
  const total = GaiaCart.getTotal();
  el.innerHTML = `
    <div class="order-summary">
      <h3 class="order-summary__title">Tu pedido</h3>
      ${items.map(i => `
        <div class="order-summary__row">
          <span>${i.name}${i.variant_label ? ` <small>(${i.variant_label})</small>` : ''} × ${i.quantity}</span>
          <span>${formatPrice(i.price * i.quantity)}</span>
        </div>`).join('')}
      <div class="order-summary__total">
        <span>Total</span><span>${formatPrice(total)}</span>
      </div>
    </div>`;
}

/** Valida solo los campos del paso 1 */
function validateStep1(form) {
  let ok = true;
  ['customer_name', 'customer_phone'].forEach(name => {
    const el = form[name];
    if (!el || !el.value.trim()) {
      if (el) el.classList.add('error');
      ok = false;
    } else {
      if (el) el.classList.remove('error');
    }
  });
  if (!form.querySelector('input[name=delivery_method]:checked')) {
    showToast('Selecciona un método de entrega.', 'error');
    return false;
  }
  if (!ok) showToast('Completa los campos obligatorios.', 'error');
  return ok;
}

/** Valida todos los campos del formulario (paso 2 incluido) */
function validateCheckoutForm(form) {
  let ok = true;
  ['customer_name', 'customer_phone'].forEach(name => {
    const el = form[name];
    if (!el || !el.value.trim()) { if (el) el.classList.add('error'); ok = false; }
    else { if (el) el.classList.remove('error'); }
  });
  if (!form.querySelector('input[name=delivery_method]:checked')) {
    showToast('Selecciona un método de entrega.', 'error'); return false;
  }
  if (!form.querySelector('input[name=payment_method]:checked')) {
    showToast('Selecciona un método de pago.', 'error'); return false;
  }
  if (!ok) showToast('Por favor completa los campos obligatorios.', 'error');
  return ok;
}

function renderOrderConfirmation(order, container) {
  if (!container) return;

  const orderItems = order.items || order.order_items || [];
  const waStore    = window._storeCache?.whatsapp?.replace(/\D/g, '');
  const waMsg      = encodeURIComponent(`Hola Gaia Bolivia! Mi pedido #${order.id} ya está pagado ✅`);
  const waUrl      = waStore ? `https://wa.me/${waStore}?text=${waMsg}` : `#`;

  container.innerHTML = `
    <div class="conf-card">

      <!-- ── Header ── -->
      <div class="conf-card__header">
        <div class="conf-icon">✅</div>
        <h2>¡Pedido recibido, ${order.customer_name?.split(' ')[0] || ''}!</h2>
        <span class="order-id">Pedido #${order.id} · ${order.status_display || 'Pendiente'}</span>
      </div>

      <!-- ── Detalles ── -->
      <div class="conf-section">
        <p class="conf-section__title">Detalles del pedido</p>
        <div class="conf-row"><span>Cliente</span><strong>${order.customer_name}</strong></div>
        <div class="conf-row"><span>Teléfono</span><strong>${order.customer_phone}</strong></div>
        <div class="conf-row"><span>Entrega</span><strong>${order.delivery_method_display}</strong></div>
        <div class="conf-row"><span>Pago</span><strong>${order.payment_method_display}</strong></div>
        ${order.customer_address ? `<div class="conf-row"><span>Dirección</span><strong>${order.customer_address}</strong></div>` : ''}
        <div class="conf-row total"><span>Total a pagar</span><strong>${formatPrice(order.total_amount)}</strong></div>
      </div>

      <!-- ── Productos ── -->
      ${orderItems.length ? `
        <div class="conf-section">
          <p class="conf-section__title">Productos ordenados</p>
          ${orderItems.map(item => `
            <div class="conf-item">
              <img class="conf-item__img"
                src="${item.product_image || item.image || 'https://placehold.co/48x48/e8d5b0/9e7d4a?text=G'}"
                alt="${item.product_name || item.name}" onerror="handleImgError(this)">
              <div style="flex:1;min-width:0">
                <p class="conf-item__name">${item.product_name || item.name}</p>
                <p class="conf-item__meta">
                  ${item.variant_label ? `${item.variant_label} · ` : ''}
                  Cantidad: ${item.quantity}
                </p>
              </div>
              <span class="conf-item__price">${formatPrice((item.unit_price || item.price) * item.quantity)}</span>
            </div>`).join('')}
        </div>` : ''}

      <!-- ── Instrucciones de pago / QR ── -->
      ${order.qr_image || order.payment_method !== 'efectivo' ? `
        <div class="conf-section conf-qr">
          <p class="conf-section__title">Instrucciones de pago</p>
          ${order.qr_image ? `
            <img src="${order.qr_image}" alt="QR de pago">
            <p>Escanea el QR con tu app de <strong>${order.payment_method_display}</strong></p>` : ''}
          <div class="conf-amount">${formatPrice(order.total_amount)}</div>
          <p style="margin-top:.5rem">
            Transfiere el monto exacto y luego sube tu comprobante.<br>
            <small>Confirmaremos tu pedido en 1-2 horas.</small>
          </p>
        </div>` : `
        <div class="conf-section" style="text-align:center">
          <p class="conf-section__title">Pago en efectivo</p>
          <p>Pagarás <strong>${formatPrice(order.total_amount)}</strong> al recoger tu pedido.</p>
        </div>`}

      <!-- ── Subir comprobante ── -->
      ${order.payment_method !== 'efectivo' ? `
        <div class="conf-section" id="receipt-upload-section">
          <p class="conf-section__title">📎 Subir comprobante de pago</p>
          ${order.payment_receipt
            ? `<p style="color:#4caf50;font-weight:600">✓ Comprobante ya enviado — te contactaremos pronto.</p>`
            : `<div id="upload-area">
                <input type="file" id="receipt-file" accept="image/*" class="sr-only">
                <label for="receipt-file" class="upload-label">
                  <span class="upload-icon">📎</span>
                  <span id="upload-text">Seleccionar imagen del comprobante</span>
                </label>
                <button class="btn btn-primary btn-full mt-2" id="upload-btn" disabled>
                  Enviar comprobante
                </button>
              </div>`}
        </div>` : ''}

      <!-- ── Acciones ── -->
      <div class="conf-section">
        <div class="conf-actions">
          <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-lg btn-whatsapp">
            💬 Consultar por WhatsApp
          </a>
          <a href="tienda.html" class="btn btn-outline">Seguir comprando</a>
          <a href="index.html" class="btn btn-ghost">Ir al inicio</a>
        </div>
        <p style="font-size:.78rem;color:var(--text-light);text-align:center;margin-top:.75rem">
          El mensaje que se enviará: <em>"Hola Gaia Bolivia! Mi pedido #${order.id} ya está pagado ✅"</em>
        </p>
      </div>

    </div>`;
}

function initReceiptUpload(orderId) {
  const fileInput = document.querySelector('#receipt-file');
  const uploadBtn = document.querySelector('#upload-btn');
  const uploadText= document.querySelector('#upload-text');

  if (!fileInput || !uploadBtn) return;

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
      uploadText.textContent = fileInput.files[0].name;
      uploadBtn.disabled = false;
    }
  });

  uploadBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Enviando...';

    try {
      await GaiaAPI.uploadReceipt(orderId, file);
      showToast('Comprobante enviado correctamente.', 'success');
      uploadBtn.textContent = '✓ Enviado';
      uploadText.textContent = 'Comprobante recibido — te contactaremos pronto.';
      uploadBtn.style.background = '#4caf50';
    } catch (err) {
      showToast(err.message, 'error');
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Enviar comprobante';
    }
  });
}

// ── Bootstrap ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  _initStoreLinks();

  const page = document.body.dataset.page;
  if (page === 'home')         initHome();
  if (page === 'tienda')       initTienda();
  if (page === 'producto')     initProducto();
  if (page === 'carrito')      initCarrito();
  if (page === 'checkout')     initCheckout();
  if (page === 'confirmacion') initConfirmacion();
});

/** Carga WhatsApp y FAB en todas las páginas */
async function _initStoreLinks() {
  try {
    const store = await GaiaAPI.getStore();
    window._storeCache = store;
    if (store.whatsapp) {
      const wa = `https://wa.me/${store.whatsapp.replace(/\D/g, '')}`;
      document.querySelectorAll('[data-whatsapp]').forEach(b => { b.href = wa; });
      const fab = document.querySelector('.whatsapp-fab');
      if (fab) fab.style.display = 'flex';
    }
  } catch (_) {}
}
