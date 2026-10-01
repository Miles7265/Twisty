const defaultProducts = [
  { id: 1, name: "Keychains", price: 25, stock: 10 },
];

let products = JSON.parse(localStorage.getItem("twistyProducts")) || defaultProducts;
let expenses = JSON.parse(localStorage.getItem("twistyExpenses")) || [];
let sales = JSON.parse(localStorage.getItem("twistySales")) || [];
let income = JSON.parse(localStorage.getItem("twistyIncome")) || [];
let lastReceipt = JSON.parse(localStorage.getItem("twistyLastReceipt")) || null;

const peso = value => "₱" + Number(value).toLocaleString("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function saveAll() {
  try {
    localStorage.setItem("twistyProducts", JSON.stringify(products));
    localStorage.setItem("twistyExpenses", JSON.stringify(expenses));
    localStorage.setItem("twistySales", JSON.stringify(sales));
    localStorage.setItem("twistyIncome", JSON.stringify(income));
    localStorage.setItem("twistyLastReceipt", JSON.stringify(lastReceipt));
  } catch (err) {
    showToast("Storage is full. Try smaller or fewer photos.");
  }
}
// Crop every photo to the same square size so they all look alike,
// and keep it small enough to save in the browser
const PHOTO_SIZE = 400;

function readPhoto(file) {
  return new Promise(resolve => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve("");
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = PHOTO_SIZE;
        canvas.height = PHOTO_SIZE;
        canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function showPhotoPreview(file) {
  const box = document.getElementById("photoPreview");
  if (file) {
    box.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Preview">`;
  } else {
    box.innerHTML = `<span class="ph-icon">📷</span><span class="ph-text">Add photo</span>`;
  }
}

document.getElementById("productPhoto").addEventListener("change", e => {
  showPhotoPreview(e.target.files[0]);
});

document.getElementById("productForm").addEventListener("submit", async e => {
  e.preventDefault();

  const name = document.getElementById("productName").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const image = await readPhoto(document.getElementById("productPhoto").files[0]);

  products.push({
    id: Date.now(),
    name,
    price,
    stock,
    image
  });

  saveAll();
  e.target.reset();
  renderInventory();
  renderDashboard();
  showToast("Product added to inventory.");
});

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
document.getElementById("incomeDate").value = todayString();

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
  if (id === "income") renderIncome();
  if (id === "expenses") renderExpenses();
  if (id === "receipt") renderReceipt();
  if (id === "report") renderReport();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function focusAddProduct() {
  showSection("inventory");
  setTimeout(() => document.getElementById("productName").focus(), 100);
}

function focusIncome() {
  showSection("income");
  setTimeout(() => document.getElementById("incomeName").focus(), 100);
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
        <td data-label="Product" class="c-product">
          <div class="prod-cell">
            <label class="thumb ${p.image ? "" : "empty"}" title="Tap to ${p.image ? "change" : "add"} photo">
              ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.name)}">` : `<span class="ph-icon">🌸</span>`}
              <span class="thumb-badge">📷</span>
              <input type="file" accept="image/*" hidden onchange="changePhoto(${p.id}, this)">
            </label>
            <div class="prod-name">
              <strong>${escapeHtml(p.name)}</strong>
              <small class="muted">${p.image ? "Tap photo to change" : "Tap to add a photo"}</small>
            </div>
          </div>
        </td>
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
async function changePhoto(id, input) {
  const product = products.find(p => p.id === id);
  if (!product || !input.files[0]) return;

  const image = await readPhoto(input.files[0]);
  if (!image) {
    showToast("Could not read that photo.");
    return;
  }

  product.image = image;
  saveAll();
  renderInventory();
  showToast(`${product.name} photo updated.`);
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
// ===== Receipt paper size =====
const paperSizes = {
  "98x148": "98mm 148mm",
};

function setPaperSize(size) {
  if (!paperSizes[size]) size = "98x148";
  localStorage.setItem("twistyPaper", size);
  document.getElementById("paperSize").value = size;

  let style = document.getElementById("pageSizeStyle");
  if (!style) {
    style = document.createElement("style");
    style.id = "pageSizeStyle";
    document.head.appendChild(style);
  }
  style.textContent = `@page { size: ${paperSizes[size]}; margin: 4mm; }`;
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
  const weeklySales = allPayments().filter(p => isThisWeek(p.date));
  const weeklyExpenses = expenses.filter(e => isThisWeek(e.date));

  const salesTotal = weeklySales.reduce((sum, p) => sum + Number(p.amount), 0);
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
          <span>${escapeHtml(s.name)}<br><small class="muted">${formatDate(s.date)} · ${escapeHtml(s.method)}</small></span>
          <strong>${peso(s.amount)}</strong>
        </div>
      `).join("")
    : `<div class="muted">No income received this week.</div>`;

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
  const salesTotal = income.reduce((sum, i) => sum + paidOf(i), 0);
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

// ===== Income & Payments =====
const paidOf = i => i.payments.reduce((sum, p) => sum + Number(p.amount), 0);
const balanceOf = i => Math.max(0, Number(i.total) - paidOf(i));

function incomeStatus(i) {
  const paid = paidOf(i);
  if (paid >= Number(i.total)) return { key: "paid", label: "Paid", cls: "good" };
  if (paid > 0) return { key: "partial", label: "Partial", cls: "low" };
  return { key: "unpaid", label: "Unpaid", cls: "out" };
}

function allPayments() {
  return income.flatMap(i => i.payments.map(p => ({ ...p, name: i.name, incomeId: i.id })));
}

function refreshMoney() {
  saveAll();
  renderIncome();
  renderDashboard();
  renderReport();
}

document.getElementById("incomeForm").addEventListener("submit", e => {
  e.preventDefault();

  const name = document.getElementById("incomeName").value.trim();
  const total = Number(document.getElementById("incomeTotal").value);
  const paid = Number(document.getElementById("incomePaid").value || 0);
  const method = document.getElementById("incomeMethod").value;
  const date = document.getElementById("incomeDate").value || todayString();

  if (paid > total) {
    showToast("Paid amount can't be more than the total.");
    return;
  }

  const id = Date.now();
  income.push({
    id,
    name,
    total,
    date,
    payments: paid > 0 ? [{ id: id + 1, amount: paid, date, method }] : []
  });

  e.target.reset();
  document.getElementById("incomeDate").value = todayString();
  refreshMoney();
  showToast(paid >= total ? "Income recorded (fully paid)." : "Income recorded.");
});

function renderIncome() {
  const body = document.getElementById("incomeBody");
  const filter = document.getElementById("incomeFilter").value;

  const received = income.reduce((sum, i) => sum + paidOf(i), 0);
  const outstanding = income.reduce((sum, i) => sum + balanceOf(i), 0);
  const unpaidCount = income.filter(i => balanceOf(i) > 0).length;
  const weekReceived = allPayments()
    .filter(p => isThisWeek(p.date))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  document.getElementById("incReceived").textContent = peso(received);
  document.getElementById("incOutstanding").textContent = peso(outstanding);
  document.getElementById("incOutstandingNote").textContent =
    unpaidCount ? `${unpaidCount} customer${unpaidCount > 1 ? "s" : ""} still owe` : "nothing owed";
  document.getElementById("incWeek").textContent = peso(weekReceived);
  document.getElementById("incCount").textContent = income.length;

  // totals per payment method
  const byMethod = {};
  allPayments().forEach(p => {
    byMethod[p.method] = (byMethod[p.method] || 0) + Number(p.amount);
  });
  const methods = Object.entries(byMethod).sort((a, b) => b[1] - a[1]);
  document.getElementById("methodList").innerHTML = methods.length
    ? methods.map(([m, amt]) => `
        <div class="list-row"><span>${escapeHtml(m)}</span><strong>${peso(amt)}</strong></div>
      `).join("")
    : `<div class="muted">No payments recorded yet.</div>`;

  const rows = [...income]
    .reverse()
    .filter(i => filter === "all" || incomeStatus(i).key === filter);

  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="8" class="muted">No income entries found.</td></tr>`;
    return;
  }

  body.innerHTML = rows.map(i => {
    const st = incomeStatus(i);
    const bal = balanceOf(i);
    const methodsUsed = [...new Set(i.payments.map(p => p.method))].join(", ") || "—";

    return `
      <tr>
        <td data-label="Customer" class="c-name"><strong>${escapeHtml(i.name)}</strong></td>
        <td data-label="Total" class="c-total">${peso(i.total)}</td>
        <td data-label="Paid" class="c-paid">${peso(paidOf(i))}</td>
        <td data-label="Balance" class="c-balance"><strong>${peso(bal)}</strong></td>
        <td data-label="Date" class="c-date">${formatDate(i.date)}</td>
        <td data-label="Status" class="c-status"><span class="status ${st.cls}">${st.label}</span></td>
        <td data-label="Method" class="c-method">${escapeHtml(methodsUsed)}</td>
        <td data-label="Action" class="c-action income-actions">
          ${bal > 0 ? `<button class="pay-btn" onclick="openPayment(${i.id})">+ Payment</button>` : ""}
          <button class="receipt-btn" onclick="makeReceipt(${i.id})">Receipt</button>
          <button class="delete-btn" onclick="deleteIncome(${i.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

let payingId = null;

function openPayment(id) {
  const entry = income.find(i => i.id === id);
  if (!entry) return;

  payingId = id;
  document.getElementById("payInfo").textContent =
    `${entry.name} — balance ${peso(balanceOf(entry))}`;
  document.getElementById("payAmount").value = balanceOf(entry);
  document.getElementById("payAmount").max = balanceOf(entry);
  document.getElementById("payDate").value = todayString();
  document.getElementById("payDialog").showModal();
}

document.getElementById("payForm").addEventListener("submit", e => {
  e.preventDefault();

  const entry = income.find(i => i.id === payingId);
  if (!entry) return;

  const amount = Number(document.getElementById("payAmount").value);
  if (amount <= 0 || amount > balanceOf(entry) + 0.001) {
    showToast("Enter an amount up to the remaining balance.");
    return;
  }

  entry.payments.push({
    id: Date.now(),
    amount,
    date: document.getElementById("payDate").value || todayString(),
    method: document.getElementById("payMethod").value
  });

  document.getElementById("payDialog").close();
  refreshMoney();
  showToast("Payment added.");
});

function deleteIncome(id) {
  const entry = income.find(i => i.id === id);
  if (!entry) return;
  if (!confirm(`Delete "${entry.name}" and its payments?`)) return;

  income = income.filter(i => i.id !== id);
  refreshMoney();
  showToast("Income entry deleted.");
}

function makeReceipt(id) {
  const entry = income.find(i => i.id === id);
  if (!entry) return;

  lastReceipt = {
    id: entry.id,
    date: new Date().toISOString(),
    items: [{ name: entry.name, qty: 1, subtotal: Number(entry.total) }],
    total: Number(entry.total)
  };
  saveAll();
  showSection("receipt");
}

// Move any old cart-era sales into the new income list (one time)
if (sales.length) {
  sales.forEach((s, n) => {
    const day = String(s.date).slice(0, 10);
    income.push({
      id: Date.now() + n,
      name: "Sale " + s.id,
      total: Number(s.total),
      date: day,
      payments: [{ id: Date.now() + 1000 + n, amount: Number(s.total), date: day, method: "Cash" }]
    });
  });
  sales = [];
  saveAll();
}

function init() {
  renderDashboard();
  renderInventory();
  renderIncome();
  renderExpenses();
  renderReceipt();
  renderReport();
}

init();
