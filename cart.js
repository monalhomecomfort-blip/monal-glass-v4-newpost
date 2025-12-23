const BOT_TOKEN = "8077484017:AAHesSbIXkI-G-ZoHpgPQgRma03P31tqkWU";
const CHAT_ID = "883840916";

/* ===================== КОШИК ===================== */

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.length;
    const el = document.getElementById("cart-count");
    if (el) {
        el.textContent = count > 0 ? `(${count})` : "";
    }
}

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

/* ===================== МАСКА ТЕЛЕФОНУ ===================== */

function formatPhone(e) {
    let v = e.target.value.replace(/\D/g, "");

    if (!v.startsWith("38")) v = "38" + v;
    if (v.length > 12) v = v.slice(0, 12);

    let formatted = "38";
    if (v.length > 2) formatted += "(" + v.substring(2, 5);
    if (v.length >= 5) formatted += ")";
    if (v.length > 5) formatted += " " + v.substring(5, 8);
    if (v.length > 8) formatted += "-" + v.substring(8, 10);
    if (v.length > 10) formatted += "-" + v.substring(10, 12);

    e.target.value = formatted;
}

/* ===================== НОВА ПОШТА (np.json) ===================== */

let NP_DATA = {};

function loadNPFromJSON() {
    fetch("/monal-glass-v4-newpost/np.json")
        .then(res => {
            if (!res.ok) {
                throw new Error("HTTP error " + res.status);
            }
            return res.json();
        })
        .then(data => {
            if (!data || Object.keys(data).length === 0) {
                console.warn("NP.json порожній або невалідний");
                return;
            }

            NP_DATA = data;
            initCityAutocomplete();
        })
        .catch(err => {
            console.warn("Довідник НП ще завантажується або тимчасово недоступний", err);
        });
}


function initCityAutocomplete() {
    const input = document.getElementById("np-city-input");
    const list = document.getElementById("np-city-list");

    const cities = Object.keys(NP_DATA);

    cities.sort((a, b) => {
        if (a === "Київ") return -1;
        if (b === "Київ") return 1;
        return a.localeCompare(b, "uk");
    });


    input.addEventListener("input", () => {
        const value = input.value.toLowerCase().trim();
        list.innerHTML = "";

        if (!value) {
            list.style.display = "none";
            return;
        }

        const matches = cities
            .filter(c => c.toLowerCase().startsWith(value))
            .slice(0, 15);

        if (matches.length === 0) {
            list.style.display = "none";
            return;
        }

        matches.forEach(city => {
            const div = document.createElement("div");
            div.className = "autocomplete-item";
            div.textContent = city;

            div.addEventListener("click", () => {
                input.value = city;
                list.innerHTML = "";
                list.style.display = "none"; // 👈 ХОВАЄМО
                fillWarehouses(city);
        });

        list.appendChild(div);
    });

        list.style.display = "block"; // 👈 ПОКАЗУЄМО ТІЛЬКИ КОЛИ Є ЩО
    });



    document.addEventListener("click", e => {
        if (!list.contains(e.target) && e.target !== input) {
            list.innerHTML = "";
            list.style.display = "none";
        }
    });

    
}


function fillCities() {
    const citySelect = document.getElementById("np-city");
    const wrhSelect = document.getElementById("np-warehouse");

    citySelect.innerHTML = `<option value="">Оберіть місто</option>`;
    wrhSelect.innerHTML = `<option value="">Оберіть відділення / поштомат</option>`;
    wrhSelect.disabled = true;

    Object.keys(NP_DATA).sort().forEach(city => {
        const opt = document.createElement("option");
        opt.value = city;
        opt.textContent = city;
        citySelect.appendChild(opt);
    });

    citySelect.addEventListener("change", () => {
        fillWarehouses(citySelect.value);
    });
}

function fillWarehouses(city) {
    const wrhSelect = document.getElementById("np-warehouse");
    wrhSelect.innerHTML = `<option value="">Оберіть відділення / поштомат</option>`;

    if (!city || !NP_DATA[city]) {
        wrhSelect.disabled = true;
        return;
    }

    NP_DATA[city].forEach(w => {
        const opt = document.createElement("option");
        opt.value = w;
        opt.textContent = w;
        wrhSelect.appendChild(opt);
    });

    wrhSelect.disabled = false;
}

/* ===================== ОФОРМЛЕННЯ ЗАМОВЛЕННЯ ===================== */

function submitOrder() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) return alert("Кошик порожній");

    const last  = document.getElementById("inp-last").value.trim();
    const first = document.getElementById("inp-first").value.trim();
    const phone = document.getElementById("inp-phone").value.trim();
    const city = document.getElementById("np-city-input").value.trim();    
    const np    = document.getElementById("np-warehouse").value;
    const pay   = document.querySelector("input[name='pay']:checked");

    if (!last || !first || !phone || !pay) {
        return alert("Заповніть всі поля");
    }

    if (!city || !np) {
        return alert("Оберіть місто та відділення");
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

/* ===================== INIT ===================== */

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    renderCart();
    loadNPFromJSON();
    setTimeout(initCityAutocomplete, 500);

   
    const phoneInput = document.getElementById("inp-phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", formatPhone);
    }
});
