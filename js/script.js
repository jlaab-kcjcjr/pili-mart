/* =========================================================
   Pili Mart POS — script.js
   Sample data only. The backend can later replace PRODUCTS
   with items from the database and save completed sales.
   ========================================================= */

/* ---------- Categories and products ---------- */
const CATEGORIES = [
  { id: "all", name: "All items", icon: "🛒", color: "--panel" },
  { id: "fresh", name: "Fresh", icon: "🥬", color: "--cat-fresh" },
  { id: "pantry", name: "Pantry", icon: "🥫", color: "--cat-pantry" },
  { id: "drinks", name: "Drinks", icon: "🧃", color: "--cat-drinks" },
  { id: "snacks", name: "Snacks", icon: "🍪", color: "--cat-snacks" },
  { id: "household", name: "Household", icon: "🧽", color: "--cat-household" },
  { id: "personal", name: "Personal care", icon: "🧴", color: "--cat-personal" },
];

const PRODUCTS = [
  { sku: "4800100000011", name: "Lakatan bananas", unit: "per kg", price: 95, cat: "fresh", icon: "🍌", stock: 42 },
  { sku: "4800100000028", name: "Red onions", unit: "1 kg", price: 160, cat: "fresh", icon: "🧅", stock: 18 },
  { sku: "4800100000035", name: "Tomatoes", unit: "1 kg", price: 90, cat: "fresh", icon: "🍅", stock: 4 },
  { sku: "4800100000042", name: "Fresh eggs", unit: "tray of 30", price: 245, cat: "fresh", icon: "🥚", stock: 25 },
  { sku: "4800100000059", name: "Whole chicken", unit: "per kg", price: 220, cat: "fresh", icon: "🍗", stock: 12 },
  { sku: "4800100000066", name: "Calamansi", unit: "500 g", price: 60, cat: "fresh", icon: "🍋", stock: 30 },

  { sku: "4800200000017", name: "Premium rice", unit: "5 kg", price: 290, cat: "pantry", icon: "🍚", stock: 60 },
  { sku: "4800200000024", name: "Sardines in tomato sauce", unit: "155 g", price: 26, cat: "pantry", icon: "🐟", stock: 140 },
  { sku: "4800200000031", name: "Soy sauce", unit: "1 L", price: 55, cat: "pantry", icon: "🫙", stock: 48 },
  { sku: "4800200000048", name: "Instant noodles", unit: "6-pack", price: 72, cat: "pantry", icon: "🍜", stock: 3 },
  { sku: "4800200000055", name: "Cooking oil", unit: "1 L", price: 98, cat: "pantry", icon: "🛢️", stock: 35 },
  { sku: "4800200000062", name: "Brown sugar", unit: "1 kg", price: 85, cat: "pantry", icon: "🍯", stock: 0 },

  { sku: "4800300000013", name: "Bottled water", unit: "1 L", price: 22, cat: "drinks", icon: "💧", stock: 200 },
  { sku: "4800300000020", name: "Orange juice", unit: "1 L", price: 110, cat: "drinks", icon: "🧃", stock: 22 },
  { sku: "4800300000037", name: "3-in-1 coffee", unit: "10 sachets", price: 95, cat: "drinks", icon: "☕", stock: 54 },
  { sku: "4800300000044", name: "Soft drink", unit: "1.5 L", price: 75, cat: "drinks", icon: "🥤", stock: 66 },

  { sku: "4800400000019", name: "Pili nuts", unit: "250 g", price: 180, cat: "snacks", icon: "🥜", stock: 28 },
  { sku: "4800400000026", name: "Chocolate bar", unit: "100 g", price: 55, cat: "snacks", icon: "🍫", stock: 75 },
  { sku: "4800400000033", name: "Butter crackers", unit: "10 packs", price: 48, cat: "snacks", icon: "🍪", stock: 40 },
  { sku: "4800400000040", name: "Potato chips", unit: "150 g", price: 42, cat: "snacks", icon: "🥔", stock: 5 },

  { sku: "4800500000015", name: "Dishwashing liquid", unit: "500 ml", price: 45, cat: "household", icon: "🧽", stock: 38 },
  { sku: "4800500000022", name: "Laundry powder", unit: "1 kg", price: 135, cat: "household", icon: "🧺", stock: 26 },
  { sku: "4800500000039", name: "Toilet paper", unit: "12 rolls", price: 210, cat: "household", icon: "🧻", stock: 19 },
  { sku: "4800500000046", name: "Trash bags", unit: "10 pieces", price: 65, cat: "household", icon: "🗑️", stock: 33 },

  { sku: "4800600000011", name: "Shampoo", unit: "340 ml", price: 120, cat: "personal", icon: "🧴", stock: 31 },
  { sku: "4800600000028", name: "Toothpaste", unit: "150 g", price: 85, cat: "personal", icon: "🪥", stock: 44 },
  { sku: "4800600000035", name: "Bath soap", unit: "135 g", price: 38, cat: "personal", icon: "🧼", stock: 90 },
  { sku: "4800600000042", name: "Rubbing alcohol", unit: "500 ml", price: 75, cat: "personal", icon: "🧪", stock: 2 },
];

/* ---------- State ---------- */
let state = {
  category: "all",
  query: "",
  cart: new Map(), // sku -> quantity
  customer: "regular",
  orderNo: 10241,
  held: [],
  method: "cash",
};

let lastSale = null;

/* ---------- Helpers ---------- */
const $ = (id) => document.getElementById(id);

const peso = (n) =>
  "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const findProduct = (sku) => PRODUCTS.find((p) => p.sku === sku);

const categoryOf = (id) => CATEGORIES.find((c) => c.id === id);

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

/* ---------- Totals (Philippine VAT and Senior/PWD rules) ----------
   Shelf prices already include 12% VAT.
   Regular: VATable sales = total / 1.12, VAT = total - VATable sales.
   Senior/PWD: remove VAT first, then take 20% off the VAT-exempt amount.
   (Real stores apply this only to qualified items; this demo applies it to all.) */
function computeTotals() {
  let subtotal = 0;
  let count = 0;
  state.cart.forEach((qty, sku) => {
    subtotal += findProduct(sku).price * qty;
    count += qty;
  });

  if (state.customer === "regular") {
    const vatable = subtotal / 1.12;
    return { count, subtotal, vatable, vat: subtotal - vatable, lessVat: 0, discount: 0, total: subtotal };
  }

  const vatExempt = subtotal / 1.12;
  const lessVat = subtotal - vatExempt;
  const discount = vatExempt * 0.2;
  return { count, subtotal, vatable: 0, vat: 0, lessVat, discount, total: vatExempt - discount };
}

/* ---------- Categories ---------- */
function renderCategories() {
  $("categories").innerHTML = CATEGORIES.map((c) => {
    const count = c.id === "all" ? PRODUCTS.length : PRODUCTS.filter((p) => p.cat === c.id).length;
    const active = state.category === c.id;
    return `
      <button class="cat-btn ${active ? "is-active" : ""}" type="button" data-cat="${c.id}" aria-pressed="${active}">
        <span class="cat-icon" style="--c: var(${c.color})">${c.icon}</span>
        <span>${c.name}</span>
        <span class="cat-count">${count}</span>
      </button>`;
  }).join("");
}

$("categories").addEventListener("click", (e) => {
  const btn = e.target.closest(".cat-btn");
  if (!btn) return;
  state.category = btn.dataset.cat;
  renderCategories();
  renderProducts();
});

/* ---------- Products ---------- */
function visibleProducts() {
  const q = state.query.trim().toLowerCase();
  return PRODUCTS.filter((p) => {
    const inCategory = state.category === "all" || p.cat === state.category;
    const matches = !q || p.name.toLowerCase().includes(q) || p.sku.includes(q);
    return inCategory && matches;
  });
}

function renderProducts() {
  const list = visibleProducts();
  const cat = categoryOf(state.category);

  $("catTitle").textContent = state.query ? `Results for “${state.query}”` : cat.name;
  $("catCount").textContent = `${list.length} ${list.length === 1 ? "item" : "items"}`;

  if (list.length === 0) {
    $("productGrid").innerHTML = `<p class="empty-search">No items match “${state.query}”. Check the spelling or scan the barcode again.</p>`;
    return;
  }

  $("productGrid").innerHTML = list
    .map((p) => {
      const inCart = state.cart.get(p.sku) || 0;
      const out = p.stock === 0;
      const low = p.stock > 0 && p.stock <= 5;
      const stockText = out ? "Out of stock" : low ? `${p.stock} left` : `${p.stock} in stock`;
      return `
        <button class="product" type="button" data-sku="${p.sku}" ${out ? "disabled" : ""}
          aria-label="Add ${p.name}, ${p.unit}, ${peso(p.price)}">
          <span class="product-art" style="--c: var(${categoryOf(p.cat).color})">${p.icon}</span>
          ${inCart ? `<span class="in-cart">${inCart}</span>` : ""}
          <span class="product-body">
            <span class="product-name">${p.name}</span>
            <span class="product-unit">${p.unit}</span>
            <span class="product-foot">
              <span class="product-price">${peso(p.price)}</span>
              <span class="stock ${low || out ? "is-low" : ""}">${stockText}</span>
            </span>
          </span>
        </button>`;
    })
    .join("");
}

$("productGrid").addEventListener("click", (e) => {
  const card = e.target.closest(".product");
  if (card && !card.disabled) addToCart(card.dataset.sku);
});

/* ---------- Cart ---------- */
function addToCart(sku) {
  const product = findProduct(sku);
  const current = state.cart.get(sku) || 0;
  if (current >= product.stock) {
    showToast(`Only ${product.stock} ${product.name} in stock`);
    return;
  }
  // Put the newest item at the bottom of the receipt
  state.cart.delete(sku);
  state.cart.set(sku, current + 1);
  renderAll(sku);
}

function changeQty(sku, delta) {
  const product = findProduct(sku);
  const next = (state.cart.get(sku) || 0) + delta;
  if (next <= 0) state.cart.delete(sku);
  else if (next > product.stock) return showToast(`Only ${product.stock} ${product.name} in stock`);
  else state.cart.set(sku, next);
  renderAll();
}

function renderOrder(flashSku) {
  const t = computeTotals();

  $("orderNo").textContent = "#" + state.orderNo;
  $("itemCount").textContent = t.count ? `${t.count} ${t.count === 1 ? "item" : "items"}` : "No items yet";

  // Lines
  if (state.cart.size === 0) {
    $("lines").innerHTML = `
      <li class="empty-cart">
        <span><b>Ready for the next customer</b>Tap an item or scan a barcode to start.</span>
      </li>`;
  } else {
    $("lines").innerHTML = [...state.cart]
      .map(([sku, qty]) => {
        const p = findProduct(sku);
        return `
          <li class="line ${sku === flashSku ? "flash" : ""}">
            <span>
              <span class="line-name">${p.name}</span><br>
              <span class="line-each">${qty} × ${peso(p.price)}</span>
            </span>
            <span class="line-total">${peso(p.price * qty)}</span>
            <span class="line-controls">
              <button class="qty-btn" type="button" data-sku="${sku}" data-delta="-1" aria-label="Remove one ${p.name}">−</button>
              <span class="qty">${qty}</span>
              <button class="qty-btn" type="button" data-sku="${sku}" data-delta="1" aria-label="Add one ${p.name}">+</button>
              <button class="remove-btn" type="button" data-remove="${sku}">Remove</button>
            </span>
          </li>`;
      })
      .join("");

    // Keep the newest item in view
    if (flashSku) $("lines").lastElementChild.scrollIntoView({ block: "nearest" });
  }

  // Totals
  let rows = `<dt>Subtotal</dt><dd>${peso(t.subtotal)}</dd>`;
  if (state.customer === "regular") {
    rows += `<dt>VATable sales</dt><dd>${peso(t.vatable)}</dd>`;
    rows += `<dt>VAT (12%)</dt><dd>${peso(t.vat)}</dd>`;
  } else {
    const label = state.customer === "senior" ? "Senior" : "PWD";
    rows += `<dt>Less VAT (exempt)</dt><dd>−${peso(t.lessVat)}</dd>`;
    rows += `<dt class="discount">${label} discount (20%)</dt><dd class="discount">−${peso(t.discount)}</dd>`;
  }
  rows += `<dt class="grand">Total</dt><dd class="grand">${peso(t.total)}</dd>`;
  $("totals").innerHTML = rows;

  $("chargeTotal").textContent = peso(t.total);
  $("chargeBtn").disabled = state.cart.size === 0;
}

$("lines").addEventListener("click", (e) => {
  const qtyBtn = e.target.closest(".qty-btn");
  const removeBtn = e.target.closest(".remove-btn");
  if (qtyBtn) changeQty(qtyBtn.dataset.sku, Number(qtyBtn.dataset.delta));
  if (removeBtn) {
    state.cart.delete(removeBtn.dataset.remove);
    renderAll();
  }
});

/* ---------- Customer type ---------- */
document.querySelectorAll(".customer-type button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".customer-type button").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    state.customer = btn.dataset.type;
    renderOrder();
    if (state.customer !== "regular") showToast("Remember to check the customer's Senior or PWD ID");
  });
});

function setCustomer(type) {
  state.customer = type;
  document.querySelectorAll(".customer-type button").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.type === type)
  );
}

/* ---------- Search and barcode ---------- */
const searchInput = $("search");

searchInput.addEventListener("input", () => {
  state.query = searchInput.value;
  renderProducts();
});

// Pressing Enter adds an exact barcode match, or the only matching item
searchInput.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const value = searchInput.value.trim();
  const byCode = PRODUCTS.find((p) => p.sku === value);
  const matches = visibleProducts().filter((p) => p.stock > 0);
  const product = byCode || (matches.length === 1 ? matches[0] : null);

  if (product) {
    addToCart(product.sku);
    searchInput.value = "";
    state.query = "";
    renderProducts();
  } else if (value) {
    showToast("No single match. Pick the item from the list.");
  }
});

// Press "/" anywhere to jump to the search box
document.addEventListener("keydown", (e) => {
  const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
  if (e.key === "/" && !typing) {
    e.preventDefault();
    searchInput.focus();
  }
  if (e.key === "Escape") {
    closePayment();
    $("heldPanel").hidden = true;
    $("heldBtn").setAttribute("aria-expanded", "false");
  }
});

/* ---------- Hold and clear ---------- */
$("holdBtn").addEventListener("click", () => {
  if (state.cart.size === 0) return showToast("Add items before holding an order");
  const t = computeTotals();
  state.held.push({
    orderNo: state.orderNo,
    cart: new Map(state.cart),
    customer: state.customer,
    total: t.total,
    count: t.count,
    time: new Date().toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" }),
  });
  showToast(`Order #${state.orderNo} is on hold`);
  startNewOrder();
});

$("clearBtn").addEventListener("click", () => {
  if (state.cart.size === 0) return;
  if (confirm("Clear all items from this order?")) {
    state.cart.clear();
    renderAll();
  }
});

function renderHeld() {
  $("heldCount").textContent = state.held.length;
  $("heldList").innerHTML = state.held.length
    ? state.held
        .map(
          (h, i) => `
          <li>
            <button class="held-item" type="button" data-index="${i}">
              <span>Order #${h.orderNo}<small>${h.count} items, held at ${h.time}</small></span>
              <strong>${peso(h.total)}</strong>
            </button>
          </li>`
        )
        .join("")
    : `<li class="popover-empty">No orders on hold.</li>`;
}

$("heldBtn").addEventListener("click", () => {
  const panel = $("heldPanel");
  panel.hidden = !panel.hidden;
  $("heldBtn").setAttribute("aria-expanded", String(!panel.hidden));
});

$("heldList").addEventListener("click", (e) => {
  const item = e.target.closest(".held-item");
  if (!item) return;
  if (state.cart.size > 0) return showToast("Finish or hold the current order first");

  const [order] = state.held.splice(Number(item.dataset.index), 1);
  state.cart = order.cart;
  state.orderNo = order.orderNo;
  setCustomer(order.customer);
  $("heldPanel").hidden = true;
  $("heldBtn").setAttribute("aria-expanded", "false");
  showToast(`Order #${order.orderNo} resumed`);
  renderAll();
});

// Close the popover when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".held-wrap")) {
    $("heldPanel").hidden = true;
    $("heldBtn").setAttribute("aria-expanded", "false");
  }
});

function startNewOrder() {
  state.cart = new Map();
  state.orderNo += 1;
  // Skip numbers that are still on hold
  while (state.held.some((h) => h.orderNo === state.orderNo)) state.orderNo += 1;
  setCustomer("regular");
  renderAll();
}

/* ---------- Payment ---------- */
function openPayment() {
  const t = computeTotals();
  $("dueAmount").textContent = peso(t.total);
  $("payStep").hidden = false;
  $("doneStep").hidden = true;
  $("cashInput").value = "";
  $("gcashInput").value = "";
  $("cardInput").value = "";
  setMethod("cash");
  renderQuickCash(t.total);
  updatePayment();
  $("payModal").hidden = false;
  $("cashInput").focus();
}

function closePayment() {
  $("payModal").hidden = true;
}

// Quick cash buttons: exact amount, next ₱100, and common bills
function renderQuickCash(total) {
  const options = new Set([total, Math.ceil(total / 100) * 100]);
  [500, 1000, 2000, 5000].forEach((bill) => { if (bill >= total) options.add(bill); });
  const list = [...options].sort((a, b) => a - b).slice(0, 5);

  $("quickCash").innerHTML = list
    .map((v, i) => `<button type="button" data-amount="${v}">${i === 0 ? "Exact" : peso(v).replace(".00", "")}</button>`)
    .join("");
}

$("quickCash").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  $("cashInput").value = Number(btn.dataset.amount).toFixed(2);
  updatePayment();
});

function setMethod(method) {
  state.method = method;
  document.querySelectorAll(".methods button").forEach((b) => {
    const active = b.dataset.method === method;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".method-panel").forEach((p) => (p.hidden = p.dataset.panel !== method));
  updatePayment();
}

document.querySelectorAll(".methods button").forEach((b) =>
  b.addEventListener("click", () => setMethod(b.dataset.method))
);

function updatePayment() {
  const total = computeTotals().total;
  let valid = false;

  if (state.method === "cash") {
    const cash = parseFloat($("cashInput").value) || 0;
    const change = cash - total;
    const line = $("changeAmount").parentElement;
    line.classList.toggle("is-short", cash > 0 && change < -0.001);
        $("changeAmount").textContent = !cash ? peso(0) : change >= -0.001 ? peso(Math.max(0, change)) : `Short ${peso(-change)}`;
    valid = cash > 0 && change >= -0.001;
  } else if (state.method === "gcash") {
    valid = $("gcashInput").value.replace(/\D/g, "").length >= 6;
  } else {
    valid = $("cardInput").value.trim().length >= 4;
  }

  $("completeBtn").disabled = !valid;
}

["cashInput", "gcashInput", "cardInput"].forEach((id) => $(id).addEventListener("input", updatePayment));

$("cashInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !$("completeBtn").disabled) completeSale();
});

$("chargeBtn").addEventListener("click", openPayment);
$("closePay").addEventListener("click", closePayment);
$("payModal").addEventListener("click", (e) => { if (e.target === $("payModal")) closePayment(); });
$("completeBtn").addEventListener("click", completeSale);

function completeSale() {
  const t = computeTotals();
  const cash = parseFloat($("cashInput").value) || 0;

  lastSale = {
    orderNo: state.orderNo,
    items: [...state.cart].map(([sku, qty]) => ({ ...findProduct(sku), qty })),
    totals: t,
    customer: state.customer,
    method: state.method,
    cash,
    change: state.method === "cash" ? cash - t.total : 0,
    reference: state.method === "gcash" ? $("gcashInput").value : state.method === "card" ? $("cardInput").value : "",
    date: new Date(),
  };

  // Reduce stock (the backend will do this in the real system)
  lastSale.items.forEach((item) => { findProduct(item.sku).stock -= item.qty; });

  /* ===== BACKEND: save the sale here =====
  fetch("/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lastSale),
  });
  */

  $("doneChange").textContent =
    lastSale.method === "cash" ? `Give change: ${peso(lastSale.change)}` : `Paid by ${lastSale.method === "gcash" ? "GCash" : "card"}`;
  $("printReceipt").innerHTML = receiptHTML(lastSale);
  $("payStep").hidden = true;
  $("doneStep").hidden = false;
  $("newSaleBtn").focus();
}

function receiptHTML(sale) {
  const t = sale.totals;
  const methodName = { cash: "Cash", gcash: "GCash", card: "Card" }[sale.method];
  const items = sale.items
    .map((i) => `<div class="pr-row"><span>${i.qty} ${i.name}</span><span>${peso(i.price * i.qty)}</span></div>`)
    .join("");

  let summary = "";
  if (sale.customer === "regular") {
    summary = `
      <div class="pr-row"><span>VATable sales</span><span>${peso(t.vatable)}</span></div>
      <div class="pr-row"><span>VAT 12%</span><span>${peso(t.vat)}</span></div>`;
  } else {
    summary = `
      <div class="pr-row"><span>Less VAT</span><span>-${peso(t.lessVat)}</span></div>
      <div class="pr-row"><span>${sale.customer === "senior" ? "Senior" : "PWD"} disc. 20%</span><span>-${peso(t.discount)}</span></div>`;
  }

  const payment =
    sale.method === "cash"
      ? `<div class="pr-row"><span>Cash</span><span>${peso(sale.cash)}</span></div>
         <div class="pr-row"><span>Change</span><span>${peso(sale.change)}</span></div>`
      : `<div class="pr-row"><span>${methodName} ref.</span><span>${sale.reference}</span></div>`;

  return `
    <div class="pr-center pr-strong">PILI MART</div>
    <div class="pr-center">Legazpi branch, Terminal 04</div>
    <div class="pr-center">${sale.date.toLocaleString("en-PH")}</div>
    <div class="pr-center">Order #${sale.orderNo}, Cashier: Ana R.</div>
    <div class="pr-sep"></div>
    ${items}
    <div class="pr-sep"></div>
    <div class="pr-row"><span>Subtotal</span><span>${peso(t.subtotal)}</span></div>
    ${summary}
    <div class="pr-row pr-strong"><span>TOTAL</span><span>${peso(t.total)}</span></div>
    ${payment}
    <div class="pr-sep"></div>
    <div class="pr-center">Thank you for shopping!</div>
    <div class="pr-center">Sample receipt, not an official receipt</div>`;
}

$("printBtn").addEventListener("click", () => window.print());

$("newSaleBtn").addEventListener("click", () => {
  closePayment();
  startNewOrder();
  showToast(`Order #${lastSale.orderNo} saved`);
});

/* ---------- Clock ---------- */
function tick() {
  $("clock").textContent = new Date().toLocaleString("en-PH", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

/* ---------- Theme toggle ---------- */
const root = document.documentElement;

function currentTheme() {
  return root.getAttribute("data-theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

function updateThemeLabel() {
  $("themeToggle").setAttribute("aria-label", `Switch to ${currentTheme() === "dark" ? "light" : "dark"} theme`);
}

$("themeToggle").addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try { localStorage.setItem("pili-theme", next); } catch (e) {}
  updateThemeLabel();
});

/* ---------- Start ---------- */
function renderAll(flashSku) {
  renderProducts();
  renderOrder(flashSku);
  renderHeld();
}

updateThemeLabel();
renderCategories();
renderAll();
tick();
setInterval(tick, 30000);