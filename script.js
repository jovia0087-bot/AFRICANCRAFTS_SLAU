// ============================================
// AFRICRAFTS - BULLETPROOF CART SYSTEM
// ============================================

// Global cart — declared at top level so onclick attrs work instantly
var cart = [];

// ============ CART STORAGE ============

function loadCart() {
    try {
        var saved = localStorage.getItem('africrafts_cart');
        cart = saved ? JSON.parse(saved) : [];
    } catch(e) {
        cart = [];
    }
    updateCartCount();
}

function saveCart() {
    try {
        localStorage.setItem('africrafts_cart', JSON.stringify(cart));
    } catch(e) {}
    updateCartCount();
    renderCartItems();
}

// ============ CORE CART FUNCTIONS ============

function addToCart(name, price, imageUrl) {
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].name === name) { existing = cart[i]; break; }
    }

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: Date.now(),
            name: name,
            price: price,
            quantity: 1,
            image: imageUrl || 'https://placehold.co/65x65/2a9d8f/white?text=Item'
        });
    }

    saveCart();
    animateCartIcon();
    showToast('🛒 ' + name + ' added to cart!');
    openCartSidebar();
}

function updateQuantity(index, delta) {
    var newQty = cart[index].quantity + delta;
    if (newQty <= 0) {
        var name = cart[index].name;
        cart.splice(index, 1);
        showToast('❌ ' + name + ' removed');
    } else {
        cart[index].quantity = newQty;
    }
    saveCart();
}

function removeItem(index) {
    var name = cart[index].name;
    cart.splice(index, 1);
    saveCart();
    showToast('❌ ' + name + ' removed');
}

// ============ CART COUNT & ANIMATION ============

function updateCartCount() {
    var total = 0;
    for (var i = 0; i < cart.length; i++) total += cart[i].quantity;
    var badges = document.querySelectorAll('.cart-count');
    badges.forEach(function(el) {
        el.textContent = total;
        // pulse animation on update
        el.style.transform = 'scale(1.5)';
        setTimeout(function() { el.style.transform = 'scale(1)'; }, 200);
    });
}

function animateCartIcon() {
    var icons = document.querySelectorAll('.cart-icon');
    icons.forEach(function(icon) {
        icon.classList.add('cart-bounce');
        setTimeout(function() { icon.classList.remove('cart-bounce'); }, 600);
    });
}

// ============ RENDER CART SIDEBAR ============

function renderCartItems() {
    var container = document.getElementById('cart-items');
    var totalEl = document.getElementById('cart-total');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty-state">
                <div class="empty-cart-icon">🛒</div>
                <p>Your cart is empty</p>
                <small>Add some beautiful African items!</small>
            </div>`;
        if (totalEl) totalEl.textContent = 'UGX 0';
        return;
    }

    var html = '';
    var total = 0;

    cart.forEach(function(item, index) {
        total += item.price * item.quantity;
        html += `
        <div class="cart-item-row" id="cart-row-${index}">
            <img src="${item.image}" class="cart-thumb" 
                 onerror="this.src='https://placehold.co/65x65/2a9d8f/white?text=Item'"
                 alt="${item.name}">
            <div class="cart-item-body">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">UGX ${item.price.toLocaleString()}</div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)">−</button>
                    <span class="qty-num">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                    <button class="remove-btn" onclick="removeItem(${index})" title="Remove">🗑</button>
                </div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
    if (totalEl) totalEl.textContent = 'UGX ' + total.toLocaleString();
}

// ============ CART SIDEBAR UI ============

function createCartUI() {
    if (document.getElementById('africrafts-cart-sidebar')) return;

    var html = `
    <style>
        /* Cart sidebar */
        #africrafts-cart-sidebar {
            position: fixed;
            top: 0;
            right: -420px;
            width: 400px;
            max-width: 100vw;
            height: 100vh;
            background: #fff;
            box-shadow: -8px 0 40px rgba(0,0,0,0.18);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            transition: right 0.35s cubic-bezier(0.4,0,0.2,1);
            font-family: 'Poppins', sans-serif;
        }
        #africrafts-cart-sidebar.open { right: 0; }

        #cart-overlay {
            position: fixed; top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 99998;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        #cart-overlay.visible { opacity: 1; pointer-events: all; }

        .cart-head {
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: white;
            padding: 1.2rem 1.4rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .cart-head h3 { margin: 0; font-size: 1.1rem; letter-spacing: 0.5px; }
        .cart-close-btn {
            background: none; border: none; color: white;
            font-size: 1.8rem; cursor: pointer; line-height: 1;
            padding: 0 4px;
            transition: transform 0.2s;
        }
        .cart-close-btn:hover { transform: rotate(90deg); }

        #cart-items {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
        }
        #cart-items::-webkit-scrollbar { width: 4px; }
        #cart-items::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

        .cart-empty-state {
            text-align: center;
            padding: 3rem 1rem;
            color: #aaa;
        }
        .empty-cart-icon { font-size: 3.5rem; margin-bottom: 0.5rem; }
        .cart-empty-state p { font-size: 1rem; margin-bottom: 4px; color: #777; }
        .cart-empty-state small { font-size: 0.8rem; }

        .cart-item-row {
            display: flex;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;
            animation: fadeSlideIn 0.3s ease;
        }
        @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateX(20px); }
            to   { opacity: 1; transform: translateX(0); }
        }

        .cart-thumb {
            width: 70px; height: 70px;
            object-fit: cover;
            border-radius: 10px;
            flex-shrink: 0;
            background: #f5f5f5;
        }
        .cart-item-body { flex: 1; }
        .cart-item-name { font-weight: 600; color: #264653; font-size: 0.95rem; margin-bottom: 3px; }
        .cart-item-price { color: #e76f51; font-weight: 500; font-size: 0.9rem; margin-bottom: 8px; }
        .cart-item-controls { display: flex; align-items: center; gap: 8px; }

        .qty-btn {
            background: #f0f0f0; border: none;
            width: 30px; height: 30px;
            border-radius: 8px; cursor: pointer;
            font-size: 1rem; font-weight: bold;
            transition: all 0.2s;
            display: flex; align-items: center; justify-content: center;
        }
        .qty-btn:hover { background: #2a9d8f; color: white; }
        .qty-num { min-width: 24px; text-align: center; font-weight: 600; }

        .remove-btn {
            background: #fff0ee; border: none;
            width: 30px; height: 30px;
            border-radius: 8px; cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.2s;
            display: flex; align-items: center; justify-content: center;
        }
        .remove-btn:hover { background: #ffe0da; }

        .cart-foot {
            padding: 1.2rem;
            border-top: 2px solid #f0f0f0;
            background: #fef9f0;
        }
        .cart-total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
            font-size: 1.15rem;
            color: #264653;
            margin-bottom: 1rem;
        }
        .checkout-btn {
            width: 100%;
            background: linear-gradient(135deg, #f4a261, #e76f51);
            color: white;
            border: none;
            padding: 14px;
            border-radius: 40px;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 15px rgba(244,162,97,0.4);
        }
        .checkout-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(231,111,81,0.5);
        }

        /* Cart icon bounce */
        .cart-bounce {
            animation: cartBounce 0.6s ease;
        }
        @keyframes cartBounce {
            0%,100% { transform: scale(1); }
            25%      { transform: scale(1.4) rotate(-10deg); }
            50%      { transform: scale(1.2) rotate(10deg); }
            75%      { transform: scale(1.3) rotate(-5deg); }
        }

        /* Cart count badge transition */
        .cart-count {
            display: inline-block;
            transition: transform 0.2s ease;
        }

        /* Toast */
        .africrafts-toast {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(80px);
            background: #264653;
            color: white;
            padding: 12px 28px;
            border-radius: 50px;
            font-family: 'Poppins', sans-serif;
            font-size: 0.9rem;
            font-weight: 500;
            z-index: 999999;
            opacity: 0;
            transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
            white-space: nowrap;
            box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        }
        .africrafts-toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }

        /* Add to cart button animation */
        .add-to-cart.adding {
            background: #264653 !important;
            transform: scale(0.96);
        }
        .add-to-cart.added {
            background: #2a9d8f !important;
        }

        @media (max-width: 480px) {
            #africrafts-cart-sidebar { width: 100%; }
        }
    </style>

    <div id="africrafts-cart-sidebar">
        <div class="cart-head">
            <h3>🛍️ Your Cart</h3>
            <button class="cart-close-btn" onclick="closeCartSidebar()">×</button>
        </div>
        <div id="cart-items"></div>
        <div class="cart-foot">
            <div class="cart-total-row">
                <span>Total</span>
                <span id="cart-total">UGX 0</span>
            </div>
            <button class="checkout-btn" onclick="showCheckoutModal()">Proceed to Checkout ✓</button>
        </div>
    </div>
    <div id="cart-overlay" onclick="closeCartSidebar()"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    renderCartItems();
}

function openCartSidebar() {
    var sidebar = document.getElementById('africrafts-cart-sidebar');
    var overlay = document.getElementById('cart-overlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('visible');
    renderCartItems();
}

function closeCartSidebar() {
    var sidebar = document.getElementById('africrafts-cart-sidebar');
    var overlay = document.getElementById('cart-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
}

// ============ CHECKOUT MODAL ============

function showCheckoutModal() {
    if (cart.length === 0) {
        showToast('🛒 Your cart is empty! Add some items first.');
        return;
    }

    var total = cart.reduce(function(sum, item) { return sum + item.price * item.quantity; }, 0);

    // Remove existing modal
    var existing = document.getElementById('checkout-modal');
    if (existing) existing.remove();

    var itemsHTML = cart.map(function(item) {
        return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:0.9rem;">
            <span>${item.name} × ${item.quantity}</span>
            <span style="color:#e76f51;font-weight:600;">UGX ${(item.price * item.quantity).toLocaleString()}</span>
        </div>`;
    }).join('');

    var modal = document.createElement('div');
    modal.id = 'checkout-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:999999;display:flex;align-items:center;justify-content:center;padding:1rem;';
    modal.innerHTML = `
        <div style="background:white;border-radius:20px;padding:2rem;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;animation:fadeSlideIn 0.3s ease;font-family:'Poppins',sans-serif;">
            <h2 style="font-family:'Playfair Display',serif;color:#264653;margin-bottom:1.5rem;font-size:1.6rem;">Order Summary</h2>
            <div style="margin-bottom:1.2rem;">${itemsHTML}</div>
            <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1.1rem;color:#264653;padding:10px 0;border-top:2px solid #264653;margin-bottom:1.5rem;">
                <span>Total</span><span style="color:#e76f51;">UGX ${total.toLocaleString()}</span>
            </div>
            <div style="margin-bottom:1rem;">
                <input id="co-name" type="text" placeholder="Full Name *" required
                    style="width:100%;padding:11px 14px;border:2px solid #e0e0e0;border-radius:10px;font-family:'Poppins',sans-serif;margin-bottom:10px;font-size:0.9rem;">
                <input id="co-phone" type="tel" placeholder="Phone Number (MTN/Airtel) *" required
                    style="width:100%;padding:11px 14px;border:2px solid #e0e0e0;border-radius:10px;font-family:'Poppins',sans-serif;margin-bottom:10px;font-size:0.9rem;">
                <input id="co-address" type="text" placeholder="Delivery Address *" required
                    style="width:100%;padding:11px 14px;border:2px solid #e0e0e0;border-radius:10px;font-family:'Poppins',sans-serif;margin-bottom:10px;font-size:0.9rem;">
                <select id="co-payment" style="width:100%;padding:11px 14px;border:2px solid #e0e0e0;border-radius:10px;font-family:'Poppins',sans-serif;margin-bottom:10px;font-size:0.9rem;background:white;">
                    <option value="">Select Payment Method</option>
                    <option>MTN Mobile Money</option>
                    <option>Airtel Money</option>
                    <option>Visa / Mastercard</option>
                    <option>PayPal</option>
                    <option>Pay on Delivery</option>
                </select>
            </div>
            <div style="display:flex;gap:10px;">
                <button onclick="document.getElementById('checkout-modal').remove()" 
                    style="flex:1;padding:12px;border:2px solid #ddd;border-radius:40px;background:white;cursor:pointer;font-weight:600;font-family:'Poppins',sans-serif;">
                    Cancel
                </button>
                <button onclick="confirmOrder()" 
                    style="flex:2;padding:12px;border:none;border-radius:40px;background:linear-gradient(135deg,#2a9d8f,#264653);color:white;cursor:pointer;font-weight:700;font-family:'Poppins',sans-serif;font-size:0.95rem;">
                    ✓ Confirm Order
                </button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
}

function confirmOrder() {
    var name    = document.getElementById('co-name').value.trim();
    var phone   = document.getElementById('co-phone').value.trim();
    var address = document.getElementById('co-address').value.trim();
    var payment = document.getElementById('co-payment').value;

    if (!name || !phone || !address || !payment) {
        showToast('⚠️ Please fill in all fields!');
        return;
    }

    var total = cart.reduce(function(sum, item) { return sum + item.price * item.quantity; }, 0);
    var modal = document.getElementById('checkout-modal');
    if (modal) modal.remove();

    // Success screen
    var success = document.createElement('div');
    success.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:999999;display:flex;align-items:center;justify-content:center;padding:1rem;';
    success.innerHTML = `
        <div style="background:white;border-radius:20px;padding:2.5rem;max-width:420px;width:100%;text-align:center;font-family:'Poppins',sans-serif;animation:fadeSlideIn 0.3s ease;">
            <div style="font-size:4rem;margin-bottom:1rem;">✅</div>
            <h2 style="font-family:'Playfair Display',serif;color:#264653;margin-bottom:0.5rem;">Order Confirmed!</h2>
            <p style="color:#666;margin-bottom:1rem;">Thank you, <strong>${name}</strong>! Your order has been received.</p>
            <div style="background:#f9f9f9;border-radius:12px;padding:1rem;margin-bottom:1.5rem;font-size:0.9rem;text-align:left;">
                <div style="margin-bottom:4px;"><strong>📱 Contact:</strong> ${phone}</div>
                <div style="margin-bottom:4px;"><strong>📍 Delivery:</strong> ${address}</div>
                <div style="margin-bottom:4px;"><strong>💳 Payment:</strong> ${payment}</div>
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;font-weight:700;color:#e76f51;"><strong>Total: UGX ${total.toLocaleString()}</strong></div>
            </div>
            <p style="color:#888;font-size:0.85rem;margin-bottom:1.5rem;">We'll call you within 24 hours for delivery confirmation. 🇺🇬 Asante Sana!</p>
            <button onclick="this.closest('div[style]').remove()" 
                style="background:linear-gradient(135deg,#f4a261,#e76f51);color:white;border:none;padding:12px 32px;border-radius:40px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;">
                Continue Shopping
            </button>
        </div>`;
    document.body.appendChild(success);

    cart = [];
    saveCart();
    closeCartSidebar();
}

// ============ TOAST NOTIFICATION ============

var toastTimer = null;
function showToast(message) {
    var toast = document.getElementById('africrafts-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'africrafts-toast';
        toast.className = 'africrafts-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

// ============ NEWSLETTER ============

function handleNewsletter(event) {
    if (event) event.preventDefault();
    var input = event && event.target ? event.target.querySelector('input') : null;
    if (input && input.value) {
        showToast('📧 Thanks for subscribing! We\'ll keep you updated.');
        if (event.target) event.target.reset();
    }
    return false;
}

function handleContactForm(event) {
    if (event) event.preventDefault();
    showToast('✅ Message sent! We\'ll get back to you soon.');
    if (event && event.target) event.target.reset();
    return false;
}

// ============ INIT ============

// Expose everything globally IMMEDIATELY so onclick attrs work
window.addToCart        = addToCart;
window.updateQuantity   = updateQuantity;
window.removeItem       = removeItem;
window.openCartSidebar  = openCartSidebar;
window.closeCartSidebar = closeCartSidebar;
window.showCheckoutModal = showCheckoutModal;
window.confirmOrder     = confirmOrder;
window.handleNewsletter = handleNewsletter;
window.handleContactForm= handleContactForm;

// Setup on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    createCartUI();
    console.log('✅ AfriCrafts cart system ready!');
});