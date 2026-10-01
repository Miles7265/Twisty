const defaultProducts = [
  { id: 1, name: "Pink Rose Bouquet", price: 850, stock: 12 },
  { id: 2, name: "Tulip Twist", price: 750, stock: 8 },
  { id: 3, name: "Sunflower Bloom", price: 650, stock: 15 },
  { id: 4, name: "Baby's Breath", price: 450, stock: 20 },
  { id: 5, name: "Mixed Flower Bouquet", price: 1200, stock: 6 },
  { id: 6, name: "Pink Carnation", price: 550, stock: 10 }
];

let products = JSON.parse(localStorage.getItem("twistyProducts")) || defaultProducts;
let expenses = JSON.parse(localStorage.getItem("twistyExpenses")) || [];
let sales = JSON.parse(localStorage.getItem("twistySales")) || [];
let lastReceipt = JSON.parse(localStorage.getItem("twistyLastReceipt")) || null;

const peso = value => "₱" + Number(value).toLocaleString("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function saveAll() {
  localStorage.setItem("twistyProducts", JSON.stringify(products));
  localStorage.setItem("twistyExpenses", JSON.stringify(expenses));
  localStorage.setItem("twistySales", JSON.stringify(sales));
  localStorage.setItem("twistyLastReceipt", JSON.stringify(lastReceipt));
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

document.getElementById("currentDate").textContent = new Date().toLocaleDateString("en-PH", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
});

document.getElementById("expenseDate").value = todayString();

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => showSection(btn.dataset.section));
});

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  document.getElementById(id).classList.add("active");
  const nav = document.querySelector(`.nav-btn[data-section="${id}"]`);
  if (nav) nav.classList.add("active");

  if (id === "dashboard") renderDashboard();
  if (id === "inventory") renderInventory();
  if (id === "expenses") renderExpenses();
  if (id === "receipt") renderReceipt();
  if (id === "report") renderReport();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function focusAddProduct() {
  showSection("inventory");
  setTimeout(() => document.getElementById("productName").focus(), 100);
}

function focusExpense() {
  showSection("expenses");
  setTimeout(() => document.getElementById("expenseName").focus(), 100);
}

document.getElementById("productForm").addEventListener("submit", e => {
  e.preventDefault();

  const name = document.getElementById("productName").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);

  products.push({
    id: Date.now(),
    name,
    price,
    stock
  });

  saveAll();
  e.target.reset();
  renderInventory();
  renderDashboard();
  showToast("Product added to inventory.");
});

function renderInventory() {
  const search = document.getElementById("inventorySearch").value.toLowerCase();
  const body = document.getElementById("inventoryBody");

  const filtered = products.filter(p => p.name.toLowerCase().includes(search));

  if (!filtered.length) {
    body.innerHTML = `<tr><td colspan="6" class="muted">No products found.</td></tr>`;
    return;
  }

  body.innerHTML = filtered.map(p => {
    let status = "In Stock";
    let cls = "good";

    if (p.stock === 0) {
      status = "Out of Stock";
      cls = "out";
    } else if (p.stock <= 5) {
      status = "Low Stock";
      cls = "low";
    }

    return `
      <tr>
        <td data-label="Product"><strong>${escapeHtml(p.name)}</strong></td>
        <td data-label="Price" class="c-price">${peso(p.price)}</td>
        <td data-label="Stock" class="c-stock"><strong>${p.stock}</strong></td>
        <td data-label="Status" class="c-status"><span class="status ${cls}">${status}</span></td>
        <td data-label="Update" class="c-update">
          <input class="stock-input" type="number" inputmode="numeric" min="0" value="${p.stock}"
            onchange="updateStock(${p.id}, this.value)">
        </td>
        <td data-label="Action" class="c-action"><button class="delete-btn" onclick="deleteProduct(${p.id})">Delete</button></td>
      </tr>
    `;
  }).join("");
}

function updateStock(id, value) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  product.stock = Math.max(0, Number(value));
  saveAll();
  renderInventory();
  renderDashboard();
  showToast(`${product.name} stock updated.`);
}

function deleteProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  if (!confirm(`Delete ${product.name} from inventory?`)) return;

  products = products.filter(p => p.id !== id);

  saveAll();
  renderInventory();
  renderDashboard();
  showToast("Product deleted.");
}

function renderReceipt() {
  const box = document.getElementById("receiptBox");

  if (!lastReceipt) {
    box.innerHTML = `<div class="receipt-empty">No receipt yet.</div>`;
    return;
  }

  const date = new Date(lastReceipt.date).toLocaleString("en-PH");

  box.innerHTML = `
    <div class="receipt-header">
      <div style="font-size: 30px;">🌷</div>
      <h2>Twisty Bloom</h2>
      <div>Flower Shop</div>
      <div class="receipt-meta">
        Receipt No. ${lastReceipt.id}<br>
        ${date}
      </div>
    </div>
    <div>
      ${lastReceipt.items.map(item => `
        <div class="receipt-line">
          <span>${escapeHtml(item.name)} × ${item.qty}</span>
          <strong>${peso(item.subtotal)}</strong>
        </div>
      `).join("")}
    </div>
    <div class="receipt-total">
      <span>TOTAL</span>
      <span>${peso(lastReceipt.total)}</span>
    </div>
    <div class="receipt-thanks">Thank you for choosing Twisty Bloom! 🌸</div>
  `;
}

function printReceipt() {
  if (!lastReceipt) {
    showToast("There is no receipt to print yet.");
    return;
  }
  window.print();
}

document.getElementById("expenseForm").addEventListener("submit", e => {
  e.preventDefault();

  const name = document.getElementById("expenseName").value.trim();
  const amount = Number(document.getElementById("expenseAmount").value);
  const date = document.getElementById("expenseDate").value || todayString();

  expenses.push({
    id: Date.now(),
    name,
    amount,
    date
  });

  saveAll();
  e.target.reset();
  document.getElementById("expenseDate").value = todayString();
  renderExpenses();
  renderDashboard();
  renderReport();
  showToast("Expense added.");
});

function renderExpenses() {
  const body = document.getElementById("expenseBody");
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  document.getElementById("expenseTotal").textContent = peso(total);

  if (!expenses.length) {
    body.innerHTML = `<tr><td colspan="4" class="muted">No expenses recorded.</td></tr>`;
    return;
  }

  body.innerHTML = [...expenses].reverse().map(e => `
    <tr>
      <td>${formatDate(e.date)}</td>
      <td>${escapeHtml(e.name)}</td>
      <td><strong>${peso(e.amount)}</strong></td>
      <td><button class="delete-btn" onclick="deleteExpense(${e.id})">Delete</button></td>
    </tr>
  `).join("");
}

function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveAll();
  renderExpenses();
  renderDashboard();
  renderReport();
  showToast("Expense deleted.");
}

function getStartOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function isThisWeek(dateValue) {
  const date = new Date(dateValue);
  const start = getStartOfWeek();
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date < end;
}

function renderReport() {
  const weeklySales = sales.filter(s => isThisWeek(s.date));
  const weeklyExpenses = expenses.filter(e => isThisWeek(e.date));

  const salesTotal = weeklySales.reduce((sum, s) => sum + Number(s.total), 0);
  const expenseTotal = weeklyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  document.getElementById("weeklySales").textContent = peso(salesTotal);
  document.getElementById("weeklyExpenses").textContent = peso(expenseTotal);
  document.getElementById("weeklyNet").textContent = peso(salesTotal - expenseTotal);
  document.getElementById("weeklyTransactions").textContent = weeklySales.length;

  const salesList = document.getElementById("weeklySalesList");
  const expenseList = document.getElementById("weeklyExpenseList");

  salesList.innerHTML = weeklySales.length
    ? weeklySales.map(s => `
        <div class="list-row">
          <span>${s.id}<br><small class="muted">${formatDate(s.date)}</small></span>
          <strong>${peso(s.total)}</strong>
        </div>
      `).join("")
    : `<div class="muted">No sales recorded this week.</div>`;

  expenseList.innerHTML = weeklyExpenses.length
    ? weeklyExpenses.map(e => `
        <div class="list-row">
          <span>${escapeHtml(e.name)}<br><small class="muted">${formatDate(e.date)}</small></span>
          <strong>${peso(e.amount)}</strong>
        </div>
      `).join("")
    : `<div class="muted">No expenses recorded this week.</div>`;
}

function renderDashboard() {
  const totalStock = products.reduce((sum, p) => sum + Number(p.stock), 0);
  const salesTotal = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  document.getElementById("dashProducts").textContent = products.length;
  document.getElementById("dashStock").textContent = totalStock;
  document.getElementById("dashSales").textContent = peso(salesTotal);
  document.getElementById("dashExpenses").textContent = peso(expenseTotal);

  const low = products.filter(p => p.stock <= 5);
  const lowContainer = document.getElementById("lowStockList");

  lowContainer.innerHTML = low.length
    ? low.map(p => `
        <div class="list-row">
          <span>${escapeHtml(p.name)}</span>
          <strong>${p.stock} left</strong>
        </div>
      `).join("")
    : `<div class="muted">All products have more than 5 units.</div>`;
}

function formatDate(date) {
  return new Date(date + (date.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function init() {
  renderDashboard();
  renderInventory();
  renderExpenses();
  renderReceipt();
  renderReport();
}

init();
