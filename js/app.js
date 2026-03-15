// ============================================================
// app.js — Main Application Logic
// ============================================================

/* ── Toast System ────────────────────────────────────────────── */
const Toast = {
    container: null,
    init() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    show(message, type = 'success', duration = 3000) {
        if (!this.container) this.init();
        const icons = { success: '✅', error: '❌', info: 'ℹ️', cart: '🛒' };
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
        this.container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('removing');
            toast.addEventListener('animationend', () => toast.remove());
        }, duration);
    }
};

/* ── Dark Mode ───────────────────────────────────────────────── */
const DarkMode = {
    STORAGE_KEY: 'foodbyYupp_darkMode',
    init() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved === 'true') document.documentElement.setAttribute('data-theme', 'dark');
        document.querySelectorAll('.dark-toggle').forEach(btn => {
            btn.addEventListener('click', () => this.toggle());
            this.setIcon(btn);
        });
    },
    toggle() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem(this.STORAGE_KEY, 'false');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem(this.STORAGE_KEY, 'true');
        }
        document.querySelectorAll('.dark-toggle').forEach(btn => this.setIcon(btn));
    },
    setIcon(btn) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        btn.textContent = isDark ? '☀️' : '🌙';
        btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
};

/* ── Favorites ───────────────────────────────────────────────── */
const Favorites = {
    STORAGE_KEY: 'foodbyYupp_favs',
    getAll() { try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || []; } catch { return []; } },
    toggle(id) {
        let favs = this.getAll();
        const idx = favs.indexOf(id);
        if (idx >= 0) { favs.splice(idx, 1); Toast.show('Removed from wishlist', 'info'); }
        else { favs.push(id); Toast.show('Added to wishlist ❤️', 'success'); }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favs));
        return favs.includes(id);
    },
    has(id) { return this.getAll().includes(id); }
};

/* ── Rating Stars Helper ─────────────────────────────────────── */
function starsHTML(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.4 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

/* ── Food Card Factory ───────────────────────────────────────── */
function createFoodCard(item) {
    const qty = Cart.getQty(item.id);
    const isFav = Favorites.has(item.id);
    const card = document.createElement('div');
    card.className = 'food-card';
    card.dataset.id = item.id;

    const badgeHTML = item.badge
        ? `<span class="card-badge">${item.badge}</span>` : '';
    const qtyHTML = qty > 0
        ? `<div class="qty-control">
         <button class="qty-btn qty-dec" data-id="${item.id}">−</button>
         <span class="qty-num">${qty}</span>
         <button class="qty-btn qty-inc" data-id="${item.id}">+</button>
       </div>`
        : `<button class="add-btn" data-id="${item.id}">+ Add</button>`;

    card.innerHTML = `
    <div class="food-card-img">
      <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'">
      ${badgeHTML}
      <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${item.id}" aria-label="Favourite">${isFav ? '❤️' : '🤍'}</button>
    </div>
    <div class="food-card-body">
      <div class="food-card-top">
        <span class="food-name">${item.name}</span>
        <span class="food-type"><span class="${item.type === 'veg' ? 'veg-dot' : 'nonveg-dot'}"></span></span>
      </div>
      <div class="food-meta">
        <span class="rating-badge">⭐ ${item.rating}</span>
        <span class="food-time">🕐 ${item.time} min</span>
        <span class="food-sep">·</span>
        <span class="food-restaurant">${item.restaurant}</span>
      </div>
      <p class="food-desc">${item.description}</p>
      <div class="food-footer">
        <div class="food-price">
          <span class="current">₹${item.price}</span>
          <span class="original">₹${item.originalPrice}</span>
        </div>
        ${qtyHTML}
      </div>
    </div>`;

    /* card click → open modal */
    card.querySelector('.food-card-img img').addEventListener('click', () => App.openModal(item));
    card.querySelector('.food-name').addEventListener('click', () => App.openModal(item));

    /* add */
    const addBtn = card.querySelector('.add-btn');
    if (addBtn) addBtn.addEventListener('click', e => { e.stopPropagation(); App.addToCart(item, card); });

    /* qty */
    const decBtn = card.querySelector('.qty-dec');
    const incBtn = card.querySelector('.qty-inc');
    if (decBtn) decBtn.addEventListener('click', e => { e.stopPropagation(); Cart.decrementQty(item.id); App.refreshCard(item, card); });
    if (incBtn) incBtn.addEventListener('click', e => { e.stopPropagation(); Cart.incrementQty(item.id); App.refreshCard(item, card); });

    /* fav */
    card.querySelector('.fav-btn').addEventListener('click', e => {
        e.stopPropagation();
        const btn = e.currentTarget;
        const isNowFav = Favorites.toggle(item.id);
        btn.classList.toggle('active', isNowFav);
        btn.textContent = isNowFav ? '❤️' : '🤍';
    });

    return card;
}

/* ── App Controller ──────────────────────────────────────────── */
const App = {
    activeCategory: 'all',
    searchQuery: '',
    activeModal: null,

    /* ── init ── */
    init() {
        DarkMode.init();
        Cart.init();
        Toast.init();
        this.hideLoading();
        if (document.getElementById('food-grid')) this.renderFoodGrid();
        if (document.getElementById('offers-grid')) this.renderOffers();
        if (document.getElementById('cat-strip')) this.renderCategories();
        this.bindNavEvents();
    },

    /* ── Loading screen ── */
    hideLoading() {
        const ov = document.getElementById('loading-overlay');
        if (ov) setTimeout(() => { ov.style.opacity = '0'; setTimeout(() => ov.remove(), 400); }, 600);
    },

    /* ── Render helpers ── */
    renderOffers() {
        const grid = document.getElementById('offers-grid');
        if (!grid) return;
        grid.innerHTML = OFFER_BANNERS.map(b => `
      <div class="offer-card" style="background:${b.color}">
        <span class="offer-icon">${b.icon}</span>
        <div><div class="offer-title">${b.title}</div><div class="offer-sub">${b.sub || b.subtitle}</div></div>
      </div>`).join('');
    },

    renderCategories() {
        const strip = document.getElementById('cat-strip');
        if (!strip) return;
        strip.innerHTML = CATEGORIES.map(c => `
      <button class="cat-pill ${c.id === this.activeCategory ? 'active' : ''}" data-cat="${c.id}">
        <span class="cat-emoji">${c.icon}</span> ${c.label}
      </button>`).join('');
        strip.querySelectorAll('.cat-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                this.activeCategory = pill.dataset.cat;
                strip.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.renderFoodGrid();
            });
        });
    },

    filtered() {
        return FOOD_ITEMS.filter(item => {
            const matchCat = this.activeCategory === 'all' || item.category === this.activeCategory;
            const q = this.searchQuery.toLowerCase();
            const matchQ = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.restaurant.toLowerCase().includes(q);
            return matchCat && matchQ;
        });
    },

    renderFoodGrid() {
        const grid = document.getElementById('food-grid');
        if (!grid) return;
        const items = this.filtered();
        const count = document.getElementById('results-count');
        if (count) count.textContent = `Showing ${items.length} items`;
        grid.innerHTML = '';
        if (items.length === 0) {
            grid.innerHTML = `<div class="no-results" style="grid-column:1/-1">
        <div class="no-results-icon">🍽️</div>
        <div class="no-results-title">No items found</div>
        <div class="no-results-sub">Try a different search or category</div>
      </div>`;
            return;
        }
        items.forEach((item, i) => {
            const card = createFoodCard(item);
            card.style.animationDelay = `${i * 50}ms`;
            grid.appendChild(card);
        });
    },

    /* ── Add to cart (from grid) ── */
    addToCart(item, card) {
        Cart.add(item);
        Toast.show(`${item.name} added to cart!`, 'cart');
        this.refreshCard(item, card);
    },

    /* ── Refresh a single card's qty control after change ── */
    refreshCard(item, card) {
        const footer = card.querySelector('.food-footer');
        if (!footer) return;
        const qty = Cart.getQty(item.id);
        let ctrl = footer.querySelector('.add-btn, .qty-control');
        if (ctrl) ctrl.remove();
        let newCtrl;
        if (qty > 0) {
            newCtrl = document.createElement('div');
            newCtrl.className = 'qty-control';
            newCtrl.innerHTML = `
        <button class="qty-btn qty-dec" data-id="${item.id}">−</button>
        <span class="qty-num">${qty}</span>
        <button class="qty-btn qty-inc" data-id="${item.id}">+</button>`;
            newCtrl.querySelector('.qty-dec').addEventListener('click', e => { e.stopPropagation(); Cart.decrementQty(item.id); this.refreshCard(item, card); });
            newCtrl.querySelector('.qty-inc').addEventListener('click', e => { e.stopPropagation(); Cart.incrementQty(item.id); this.refreshCard(item, card); });
        } else {
            newCtrl = document.createElement('button');
            newCtrl.className = 'add-btn';
            newCtrl.dataset.id = item.id;
            newCtrl.textContent = '+ Add';
            newCtrl.addEventListener('click', e => { e.stopPropagation(); this.addToCart(item, card); });
        }
        footer.appendChild(newCtrl);
    },

    /* ── Modal ── */
    openModal(item) {
        let overlay = document.getElementById('food-modal');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'food-modal';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }
        const qty = Cart.getQty(item.id);
        const qtyHTML = qty > 0
            ? `<div class="qty-control">
           <button class="qty-btn qty-dec" data-id="${item.id}">−</button>
           <span class="qty-num">${qty}</span>
           <button class="qty-btn qty-inc" data-id="${item.id}">+</button>
         </div>`
            : `<button class="add-btn modal-add-btn" data-id="${item.id}">+ Add to Cart</button>`;
        overlay.innerHTML = `
      <div class="modal">
        <img class="modal-img" src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'">
        <div class="modal-body">
          <div class="modal-header">
            <div>
              <div class="modal-title">${item.name}</div>
              <span class="${item.type === 'veg' ? 'veg-dot' : 'nonveg-dot'}" style="margin-top:6px;display:inline-block"></span>
              ${item.tags.map(t => `<span class="badge badge-primary" style="margin-left:6px">${t}</span>`).join('')}
            </div>
            <button class="modal-close">✕</button>
          </div>
          <div class="modal-meta">
            <span class="rating-badge">⭐ ${item.rating} (${item.reviews.toLocaleString()} reviews)</span>
            <span class="food-time">🕐 ${item.time} min</span>
            <span class="food-restaurant">🏪 ${item.restaurant}</span>
            <span class="food-time">🔥 ${item.calories} cal</span>
          </div>
          <p class="modal-desc">${item.description}</p>
          <div class="modal-footer">
            <div class="modal-price">
              <span class="big">₹${item.price}</span>
              <span class="orig">₹${item.originalPrice}</span>
            </div>
            ${qtyHTML}
          </div>
        </div>
      </div>`;
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        overlay.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', e => { if (e.target === overlay) this.closeModal(); });

        const addBtn = overlay.querySelector('.modal-add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => { Cart.add(item); Toast.show(`${item.name} added to cart!`, 'cart'); this.closeModal(); this.renderFoodGrid(); });
        }
        const decBtn = overlay.querySelector('.qty-dec');
        const incBtn = overlay.querySelector('.qty-inc');
        if (decBtn) decBtn.addEventListener('click', () => { Cart.decrementQty(item.id); this.openModal(item); });
        if (incBtn) incBtn.addEventListener('click', () => { Cart.incrementQty(item.id); this.openModal(item); });
    },

    closeModal() {
        const overlay = document.getElementById('food-modal');
        if (overlay) overlay.classList.add('hidden');
        document.body.style.overflow = '';
        this.renderFoodGrid();
    },

    /* ── Nav search binding ── */
    bindNavEvents() {
        const searchInput = document.getElementById('nav-search-input') || document.getElementById('menu-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', e => {
                this.searchQuery = e.target.value.trim();
                this.renderFoodGrid();
            });
        }
        document.querySelectorAll('[data-cat-filter]').forEach(pill => {
            pill.addEventListener('click', () => {
                this.activeCategory = pill.dataset.catFilter;
                document.querySelectorAll('[data-cat-filter]').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.renderFoodGrid();
            });
        });
    }
};

/* ── Bootstrap ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => App.init());

// const menuToggle = document.getElementById("menuToggle");
// const navLinks = document.getElementById("navLinks");

// menuToggle.addEventListener("click", function(){
//     navLinks.classList.toggle("active");
// });



// const menuToggle = document.getElementById("menuToggle");
// const navLinks = document.getElementById("navLinks");

// menuToggle.addEventListener("click", () => {
//   navLinks.classList.toggle("active");
// });

const currentPage = window.location.pathname.split("/").pop();
const navLinks = document.querySelectorAll(".nav-link");

navLinks.forEach(link => {
  const linkPage = link.getAttribute("href");

  if (linkPage === currentPage) {
    link.classList.add("active");
  }
});