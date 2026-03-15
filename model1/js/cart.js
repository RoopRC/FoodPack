// ============================================================
// cart.js — Cart Management (CRUD, LocalStorage, Coupon)
// ============================================================

const Cart = (() => {
    const STORAGE_KEY = 'foodbyYupp_cart';
    const HISTORY_KEY = 'foodbyYupp_history';
    let cart = load();

    /* ── Storage helpers ─────────────────────────────────────── */
    function load() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { return []; }
    }
    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }

    /* ── Core CRUD ───────────────────────────────────────────── */
    function getAll() { return cart; }

    function add(item) {
        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            existing.qty++;
        } else {
            cart.push({ ...item, qty: 1 });
        }
        save();
        updateBadge();
        return existing ? 'qty-up' : 'added';
    }

    function remove(id) {
        cart = cart.filter(c => c.id !== id);
        save();
        updateBadge();
    }

    function setQty(id, qty) {
        if (qty <= 0) { remove(id); return; }
        const item = cart.find(c => c.id === id);
        if (item) { item.qty = qty; save(); updateBadge(); }
    }

    function incrementQty(id) {
        const item = cart.find(c => c.id === id);
        if (item) { item.qty++; save(); updateBadge(); }
    }

    function decrementQty(id) {
        const item = cart.find(c => c.id === id);
        if (!item) return;
        if (item.qty <= 1) { remove(id); } else { item.qty--; save(); updateBadge(); }
    }

    function clear() { cart = []; save(); updateBadge(); }

    function getQty(id) {
        const item = cart.find(c => c.id === id);
        return item ? item.qty : 0;
    }

    function count() { return cart.reduce((s, c) => s + c.qty, 0); }

    /* ── Pricing ─────────────────────────────────────────────── */
    function subtotal() { return cart.reduce((s, c) => s + c.price * c.qty, 0); }
    function delivery() { const sub = subtotal(); return sub === 0 ? 0 : sub >= 299 ? 0 : 40; }
    function tax() { return Math.round(subtotal() * 0.05); }
    function discount(couponData) {
        if (!couponData) return 0;
        let d = 0;
        if (couponData.type === 'percent') {
            d = Math.round(subtotal() * couponData.value / 100);
            if (couponData.max) d = Math.min(d, couponData.max);
        } else {
            d = couponData.value;
        }
        return Math.min(d, subtotal());
    }
    function total(couponData) {
        return Math.max(0, subtotal() + delivery() + tax() - discount(couponData));
    }

    /* ── Cart badge counter ──────────────────────────────────── */
    function updateBadge() {
        const badges = document.querySelectorAll('.cart-badge');
        const n = count();
        badges.forEach(b => {
            b.textContent = n;
            b.style.display = n === 0 ? 'none' : 'flex';
        });
        // Also update cart-btn text if present
        const btnSpans = document.querySelectorAll('.cart-btn-count');
        btnSpans.forEach(s => s.textContent = n);
    }

    /* ── Order history ───────────────────────────────────────── */
    function saveOrder(orderDetails) {
        const history = getHistory();
        history.unshift(orderDetails);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }

    function getHistory() {
        try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
        catch { return []; }
    }

    /* ── Init badge on page load ─────────────────────────────── */
    function init() { updateBadge(); }

    return { getAll, add, remove, setQty, incrementQty, decrementQty, clear, getQty, count, subtotal, delivery, tax, discount, total, saveOrder, getHistory, init };
})();
