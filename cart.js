const BOT_TOKEN = "8077484017:AAHesSbIXkI-G-ZoHpgPQgRma03P31tqkWU";
const CHAT_ID = "883840916";


function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.length;
    const el = document.getElementById("cart-count");
    if (el) {
        el.textContent = count > 0 ? `(${count})` : "";
    }
}

updateCartCount();

function addToCart(name, price, label) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push({ name, price, label });
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function renderCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const list = document.getElementById("cart-list");
    const totalEl = document.getElementById("cart-total");

    if (!list || !totalEl) return;

    if (cart.length === 0) {
        list.innerHTML = "<p>Кошик порожній</p>";
        totalEl.textContent = "0 грн";
        return;
    }

    list.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <span>${item.label ? item.label + " " : ""}${item.name}</span>
            <span>${item.price} грн</span>
            <button onclick="removeFromCart(${index})">X</button>
        </div>
    `).join("");

    const total = cart.reduce((sum, i) => sum + i.price, 0);
    totalEl.textContent = total + " грн";
}


function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    updateCartCount();
}


function clearCart() {
    localStorage.removeItem("cart");
    renderCart();
    updateCartCount();
}


function showCheckout() {
    document.getElementById("checkout").style.display = "block";
    window.scrollTo(0, document.body.scrollHeight);
}

function maskPhone(input) {
    let v = input.value.replace(/\D/g, "");
    if (!v.startsWith("38")) v = "38" + v;

    v = v.slice(0, 12);

    let r = "38(";
    if (v.length > 2) r += v.slice(2,5);
    if (v.length > 5) r += ") " + v.slice(5,8);
    if (v.length > 8) r += "-" + v.slice(8,10);
    if (v.length > 10) r += "-" + v.slice(10,12);

    input.value = r;
}


function submitOrder() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) return alert("Кошик порожній");

    const last  = document.getElementById("inp-last").value.trim();
    const first = document.getElementById("inp-first").value.trim();
    const phone = document.getElementById("inp-phone").value.trim();
    const city  = document.getElementById("inp-city").value.trim();
    const np    = document.getElementById("inp-np").value.trim();
    const pay   = document.querySelector("input[name='pay']:checked");

    if (!last || !first || !phone || !city || !np || !pay) {
        return alert("Заповніть всі поля");
    }

    const phonePattern = /^38\(0\d{2}\)\s?\d{3}-\d{2}-\d{2}$/;
    if (!phonePattern.test(phone)) {
        return alert("Телефон у форматі 38(0XX)XXX-XX-XX");
    }

    const orderId = Date.now().toString().slice(-6);
    const total = cart.reduce((s, i) => s + i.price, 0);

    const itemsText = cart
        .map(i => `• ${i.label ? `[${i.label}] ` : ""}${i.name} — ${i.price} грн`)
        .join("\n");

    const text =
`🧾 *Нове замовлення №${orderId}*
👤 ${last} ${first}
📞 ${phone}
🏙 ${city}
📦 НП: ${np}
💳 Оплата: ${pay.value}

🛒 Товари:
${itemsText}

💰 Сума: ${total} грн
`;

    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text,
            parse_mode: "Markdown"
        })
    }).then(() => {
        clearCart();
        document.getElementById("checkout").innerHTML =
            `<h2>Ваше замовлення №${orderId} оформлено.</h2>
             <p>Очікуйте дзвінок оператора.</p>`;
    });
}


document.addEventListener("DOMContentLoaded", updateCartCount);
document.addEventListener("DOMContentLoaded", renderCart);

const phoneInput = document.getElementById("inp-phone");

phoneInput.addEventListener("input", formatPhone);

function formatPhone(e) {
    let v = e.target.value.replace(/\D/g, ""); // тільки цифри

    if (!v.startsWith("38")) v = "38" + v; // фіксуємо префікс

    if (v.length > 12) v = v.slice(0, 12); // максимум 12 цифр

    // Формуємо маску: 38(0XX) XXX-XX-XX
    let formatted = "38";
    if (v.length > 2) formatted += "(" + v.substring(2, 5);
    if (v.length >= 5) formatted += ")";
    if (v.length > 5) formatted += " " + v.substring(5, 8);
    if (v.length > 8) formatted += "-" + v.substring(8, 10);
    if (v.length > 10) formatted += "-" + v.substring(10, 12);

    e.target.value = formatted;
}
