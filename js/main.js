import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDetIpP7xGwNNuOZZI_UBHKZb_ojyGTyqc",
  authDomain:        "linkair-app.firebaseapp.com",
  projectId:         "linkair-app",
  storageBucket:     "linkair-app.firebasestorage.app",
  messagingSenderId: "958845292344",
  appId:             "1:958845292344:web:752086a96dbb1466487bcd",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// Active Firestore listeners — unsubscribed when switching pages
let activeListeners = [];
function clearListeners() {
  activeListeners.forEach(unsub => unsub());
  activeListeners = [];
}

// ══════════════════════════════════════════════════════════════════════════════
// ── AUTH (admin gate login) ───────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const ADMIN_EMAIL    = "admin@linkair.com";
const ADMIN_PASSWORD = "admin123";

const loginScreen  = document.getElementById("loginScreen");
const adminApp     = document.getElementById("adminApp");
const loginForm    = document.getElementById("loginForm");
const loginError   = document.getElementById("loginError");
const logoutBtn    = document.getElementById("logoutBtn");
const togglePw     = document.getElementById("togglePw");
const loginPwInput = document.getElementById("loginPassword");

togglePw.addEventListener("click", () => {
  const isText = loginPwInput.type === "text";
  loginPwInput.type = isText ? "password" : "text";
  togglePw.className = isText
    ? "fa-solid fa-eye toggle-pw"
    : "fa-solid fa-eye-slash toggle-pw";
});

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const pw    = document.getElementById("loginPassword").value;
  if (email === ADMIN_EMAIL && pw === ADMIN_PASSWORD) {
    loginError.classList.add("hidden");
    loginScreen.classList.add("hidden");
    adminApp.classList.remove("hidden");
    loadPage("dashboard");
  } else {
    loginError.classList.remove("hidden");
  }
});

logoutBtn.addEventListener("click", () => {
  showModal({
    title: "Log Out",
    body: "<p>Are you sure you want to log out of the admin panel?</p>",
    actions: [
      { label: "Cancel",  cls: "btn-cancel", cb: closeModal },
      { label: "Log Out", cls: "btn-danger",  cb: () => {
        closeModal();
        clearListeners();
        adminApp.classList.add("hidden");
        loginScreen.classList.remove("hidden");
        loginForm.reset();
      }}
    ]
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ── SIDEBAR TOGGLE ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// ══════════════════════════════════════════════════════════════════════════════
// ── NAVIGATION ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const contentEl   = document.getElementById("content");
const pageTitle   = document.getElementById("pageTitle");
const pageSub     = document.getElementById("pageSubtitle");
const menuItems   = document.querySelectorAll(".nav-menu li");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");

const subtitles = {
  dashboard:     "Monitor LinkAir platform activity and safety.",
  users:         "View and search registered user accounts.",
  parcels:       "Monitor all posted parcel listings.",
  trips:         "Oversee traveler trips and available space.",
  requests:      "View delivery requests between senders and travelers.",
  reports:       "Review user-submitted reports and flagged content.",
  notifications: "View all platform notifications sent to users.",
  settings:      "Manage your admin account and platform preferences.",
};

function loadPage(page) {
  clearListeners();
  contentEl.innerHTML = skeletonHTML();
  pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);
  pageSub.textContent   = subtitles[page] || "";
  searchInput.value     = "";
  clearSearch.classList.add("hidden");
  document.getElementById("sidebar").classList.remove("open");

  const loaders = { dashboard, users, parcels, trips, requests, reports, notifications, settings };
  if (loaders[page]) loaders[page]();
}

menuItems.forEach(item => {
  item.addEventListener("click", () => {
    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    loadPage(item.getAttribute("data-page"));
  });
});

window.gotoPage = function(page) {
  menuItems.forEach(i => {
    i.classList.toggle("active", i.getAttribute("data-page") === page);
  });
  loadPage(page);
};

// ══════════════════════════════════════════════════════════════════════════════
// ── SEARCH ────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
searchInput.addEventListener("input", function () {
  const kw = this.value.toLowerCase().trim();
  clearSearch.classList.toggle("hidden", kw === "");
  document.querySelectorAll("table tr").forEach((row, i) => {
    if (i === 0) return;
    row.style.display = row.textContent.toLowerCase().includes(kw) ? "" : "none";
  });
});

clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  clearSearch.classList.add("hidden");
  document.querySelectorAll("table tr").forEach(r => r.style.display = "");
});

// ══════════════════════════════════════════════════════════════════════════════
// ── TOAST ─────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
window.showToast = function(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className   = "toast" + (type ? " " + type : "");
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
};

// ══════════════════════════════════════════════════════════════════════════════
// ── MODAL ─────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const modalOverlay = document.getElementById("modalOverlay");
const modalBody    = document.getElementById("modalBody");
const modalClose   = document.getElementById("modalClose");

function showModal({ title, body, actions = [] }) {
  let html = `<h3>${title}</h3>${body}`;
  if (actions.length) {
    html += `<div class="modal-actions">`;
    actions.forEach((a, i) => {
      html += `<button class="${a.cls}" data-action="${i}">${a.label}</button>`;
    });
    html += `</div>`;
  }
  modalBody.innerHTML = html;
  modalOverlay.classList.remove("hidden");
  modalBody.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => actions[+btn.dataset.action].cb());
  });
}

function closeModal() { modalOverlay.classList.add("hidden"); }
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => {
  if (e.target === modalOverlay) closeModal();
});

// ══════════════════════════════════════════════════════════════════════════════
// ── SHARED HELPERS ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function viewDetail(title, rows) {
  const body = rows.map(([k, v]) => `
    <div class="modal-detail-row">
      <span>${k}</span><span>${v || "—"}</span>
    </div>`).join("");
  showModal({ title, body, actions: [{ label: "Close", cls: "btn-cancel", cb: closeModal }] });
}

function badge(s, label) {
  const map = {
    active:    "Active",
    available: "Available",
    pending:   "Pending",
    blocked:   "Blocked",
    searching: "Searching",
    matched:   "Matched",
    transit:   "In Transit",
    resolved:  "Resolved",
    accepted:  "Accepted",
    declined:  "Declined",
  };
  return `<span class="status ${s}">${label || map[s] || s}</span>`;
}

function skeletonHTML() {
  return `
    <div class="panel">
      <div class="panel-header">
        <div style="width:180px;height:22px;border-radius:8px;background:#f0f0f0;animation:shimmer 1.4s infinite;"></div>
      </div>
      ${[1,2,3,4,5].map(() => `
        <div style="display:flex;gap:16px;padding:14px 0;border-bottom:1px solid #f5f5f5;">
          ${[1,2,3,4,5].map(() =>
            `<div style="flex:1;height:14px;border-radius:6px;background:#f0f0f0;animation:shimmer 1.4s infinite;"></div>`
          ).join("")}
        </div>`).join("")}
    </div>
    <style>
      @keyframes shimmer {
        0%   { opacity:1; }
        50%  { opacity:0.35; }
        100% { opacity:1; }
      }
    </style>`;
}

function fmt(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function enc(obj) {
  return JSON.stringify(JSON.stringify(obj));
}

// ══════════════════════════════════════════════════════════════════════════════
// ── PAGE: DASHBOARD ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function dashboard() {
  let counts        = { users: 0, parcels: 0, trips: 0, requests: 0 };
  let recentParcels = [];

  function render() {
    contentEl.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
          <h3>Total Users</h3>
          <h2>${counts.users}</h2>
          <p>Registered accounts</p>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-box"></i></div>
          <h3>Active Parcels</h3>
          <h2>${counts.parcels}</h2>
          <p>Posted listings</p>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-plane"></i></div>
          <h3>Traveler Trips</h3>
          <h2>${counts.trips}</h2>
          <p>Registered trips</p>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-handshake"></i></div>
          <h3>Delivery Requests</h3>
          <h2>${counts.requests}</h2>
          <p>Total requests</p>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header"><h2>Recent Parcels</h2></div>
        <div class="table-wrapper">
          <table>
            <tr><th>Sender</th><th>Route</th><th>Status</th><th>Posted</th></tr>
            ${recentParcels.length
              ? recentParcels.map(p => `
                  <tr>
                    <td>${p.senderName || "—"}</td>
                    <td>${p.fromCity || p.pickupLocation || "—"} → ${p.toCity || p.destination || "—"}</td>
                    <td>${badge(p.status || "pending")}</td>
                    <td>${fmt(p.createdAt)}</td>
                  </tr>`).join("")
              : `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:24px;">No parcels yet</td></tr>`
            }
          </table>
        </div>
      </div>`;
  }

  const u1 = onSnapshot(collection(db, "users"), snap => {
    counts.users = snap.size; render();
  });
  const u2 = onSnapshot(
    query(collection(db, "parcels"), orderBy("createdAt", "desc")),
    snap => {
      counts.parcels  = snap.size;
      recentParcels   = snap.docs.slice(0, 6).map(d => d.data());
      render();
    }
  );
  const u3 = onSnapshot(collection(db, "trips"), snap => {
    counts.trips = snap.size; render();
  });
  const u4 = onSnapshot(collection(db, "delivery_requests"), snap => {
    counts.requests = snap.size; render();
  });

  activeListeners.push(u1, u2, u3, u4);
}

// ══════════════════════════════════════════════════════════════════════════════
// ── PAGE: USERS ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function users() {
  const unsub = onSnapshot(
    query(collection(db, "users"), orderBy("createdAt", "desc")),
    snap => {
      const rows = snap.docs.map(doc => {
        const u    = doc.data();
        const name = `${u.firstname || ""} ${u.lastname || ""}`.trim() || u.username || "—";
        return `
          <tr>
            <td><strong>${name}</strong></td>
            <td>${u.email        || "—"}</td>
            <td>${u.username     || "—"}</td>
            <td>${u.phonenumber  || "—"}</td>
            <td>${u.date         || "—"}</td>
            <td>${fmt(u.createdAt)}</td>
            <td>
              <button class="action-btn gold"
                onclick='viewUserModal(${enc({ ...u, _docId: doc.id })})'>View</button>
            </td>
          </tr>`;
      }).join("");

      contentEl.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <h2>Users
              <span style="font-size:14px;color:var(--muted);font-weight:600;margin-left:8px;">
                ${snap.size} total
              </span>
            </h2>
          </div>
          <div class="table-wrapper">
            <table>
              <tr>
                <th>Full Name</th><th>Email</th><th>Username</th>
                <th>Phone</th><th>Birth Date</th><th>Joined</th><th>Actions</th>
              </tr>
              ${rows || emptyState("fa-users", "No users yet")}
            </table>
          </div>
        </div>`;
    }
  );
  activeListeners.push(unsub);
}

window.viewUserModal = function(jsonStr) {
  const u    = JSON.parse(jsonStr);
  const name = `${u.firstname || ""} ${u.lastname || ""}`.trim() || u.username || "—";
  viewDetail(`User — ${name}`, [
    ["Full Name",  name],
    ["Username",   u.username     || "—"],
    ["Email",      u.email        || "—"],
    ["Phone",      u.phonenumber  || "—"],
    ["Birth Date", u.date         || "—"],
    ["UID",        u.uid          || u._docId || "—"],
    ["Joined",     fmt(u.createdAt)],
  ]);
};

// ══════════════════════════════════════════════════════════════════════════════
// ── PAGE: PARCELS ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function parcels() {
  const unsub = onSnapshot(
    query(collection(db, "parcels"), orderBy("createdAt", "desc")),
    snap => {
      const rows = snap.docs.map(doc => {
        const p    = doc.data();
        const from = p.fromCity || p.pickupLocation || "—";
        const to   = p.toCity   || p.destination   || "—";
        const price = p.proposedPrice || p.price    || "—";
        return `
          <tr>
            <td><strong>${p.packageType || "—"}</strong></td>
            <td>${p.senderName  || "—"}</td>
            <td>${from} → ${to}</td>
            <td>${p.weight      || "—"}</td>
            <td>${price !== "—" ? price + " $" : "—"}</td>
            <td>${badge(p.status || "searching")}</td>
            <td>${fmt(p.createdAt)}</td>
            <td>
              <button class="action-btn gold"
                onclick='viewParcelModal(${enc({ ...p, _docId: doc.id })})'>Details</button>
            </td>
          </tr>`;
      }).join("");

      contentEl.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <h2>Parcels
              <span style="font-size:14px;color:var(--muted);font-weight:600;margin-left:8px;">
                ${snap.size} total
              </span>
            </h2>
          </div>
          <div class="table-wrapper">
            <table>
              <tr>
                <th>Type</th><th>Sender</th><th>Route</th>
                <th>Weight</th><th>Price</th><th>Status</th><th>Posted</th><th>Actions</th>
              </tr>
              ${rows || emptyState("fa-box", "No parcels yet")}
            </table>
          </div>
        </div>`;
    }
  );
  activeListeners.push(unsub);
}

window.viewParcelModal = function(jsonStr) {
  const p    = JSON.parse(jsonStr);
  const from = p.fromCity || p.pickupLocation || "—";
  const to   = p.toCity   || p.destination   || "—";
  viewDetail(`Parcel — ${p.packageType || "—"}`, [
    ["Parcel ID",      p._docId          || "—"],
    ["Package Type",   p.packageType     || "—"],
    ["Weight",         p.weight          || "—"],
    ["Sender",         p.senderName      || "—"],
    ["Sender Email",   p.senderEmail     || "—"],
    ["From",           from],
    ["To",             to],
    ["Proposed Price", p.proposedPrice || p.price || "—"],
    ["Delivery Type",  p.deliveryType    || "—"],
    ["Receiver Name",  p.receiverName    || "—"],
    ["Deadline",       p.deadline        || "—"],
    ["Description",    p.description     || "—"],
    ["Status",         p.status          || "—"],
    ["Posted",         fmt(p.createdAt)],
  ]);
};

// ══════════════════════════════════════════════════════════════════════════════
// ── PAGE: TRIPS ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function trips() {
  const unsub = onSnapshot(
    query(collection(db, "trips"), orderBy("createdAt", "desc")),
    snap => {
      const rows = snap.docs.map(doc => {
        const t = doc.data();
        return `
          <tr>
            <td><strong>${t.travelerName  || "—"}</strong></td>
            <td>${t.fromCity || "—"} (${t.fromCode || "—"})</td>
            <td>${t.toCity   || "—"} (${t.toCode   || "—"})</td>
            <td>${t.flightNumber   || "—"}</td>
            <td>${t.departureDate  || "—"}</td>
            <td>${t.luggageSpace ? t.luggageSpace + " kg" : "—"}</td>
            <td>${badge(t.status || "available")}</td>
            <td>
              <button class="action-btn gold"
                onclick='viewTripModal(${enc({ ...t, _docId: doc.id })})'>Details</button>
            </td>
          </tr>`;
      }).join("");

      contentEl.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <h2>Traveler Trips
              <span style="font-size:14px;color:var(--muted);font-weight:600;margin-left:8px;">
                ${snap.size} total
              </span>
            </h2>
          </div>
          <div class="table-wrapper">
            <table>
              <tr>
                <th>Traveler</th><th>From</th><th>To</th>
                <th>Flight</th><th>Departure</th><th>Space</th><th>Status</th><th>Actions</th>
              </tr>
              ${rows || emptyState("fa-plane", "No trips yet")}
            </table>
          </div>
        </div>`;
    }
  );
  activeListeners.push(unsub);
}

window.viewTripModal = function(jsonStr) {
  const t = JSON.parse(jsonStr);
  viewDetail(`Trip — ${t.travelerName || "—"}`, [
    ["Trip ID",        t._docId          || "—"],
    ["Traveler",       t.travelerName    || "—"],
    ["Traveler UID",   t.travelerUid || t.uid || "—"],
    ["From",           `${t.fromCity || "—"} (${t.fromCode || "—"})`],
    ["To",             `${t.toCity   || "—"} (${t.toCode   || "—"})`],
    ["Flight Number",  t.flightNumber    || "—"],
    ["Departure Date", t.departureDate   || "—"],
    ["Luggage Space",  t.luggageSpace ? t.luggageSpace + " kg" : "—"],
    ["Status",         t.status          || "—"],
    ["Posted",         fmt(t.createdAt)],
  ]);
};

// ══════════════════════════════════════════════════════════════════════════════
// ── PAGE: REQUESTS ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function requests() {
  const unsub = onSnapshot(
    query(collection(db, "delivery_requests"), orderBy("createdAt", "desc")),
    snap => {
      const rows = snap.docs.map(doc => {
        const r     = doc.data();
        const route = r.fromCity
          ? `${r.fromCity} → ${r.toCity || r.destination || "—"}`
          : (r.destination || "—");
        return `
          <tr>
            <td>${r.senderName     || "—"}</td>
            <td>${r.travelerName   || "—"}</td>
            <td>${r.packageType    || "—"}</td>
            <td>${route}</td>
            <td>${r.proposedPayment ? r.proposedPayment + " $" : "—"}</td>
            <td>${badge(r.requestStatus || "pending")}</td>
            <td>${fmt(r.createdAt)}</td>
            <td>
              <button class="action-btn gold"
                onclick='viewRequestModal(${enc({ ...r, _docId: doc.id })})'>View</button>
            </td>
          </tr>`;
      }).join("");

      contentEl.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <h2>Delivery Requests
              <span style="font-size:14px;color:var(--muted);font-weight:600;margin-left:8px;">
                ${snap.size} total
              </span>
            </h2>
          </div>
          <div class="table-wrapper">
            <table>
              <tr>
                <th>Sender</th><th>Traveler</th><th>Package</th>
                <th>Route</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
              ${rows || emptyState("fa-handshake", "No requests yet")}
            </table>
          </div>
        </div>`;
    }
  );
  activeListeners.push(unsub);
}

window.viewRequestModal = function(jsonStr) {
  const r = JSON.parse(jsonStr);
  viewDetail("Delivery Request", [
    ["Request ID",      r._docId           || "—"],
    ["Sender",          r.senderName       || "—"],
    ["Sender UID",      r.senderUid        || "—"],
    ["Traveler",        r.travelerName     || "—"],
    ["Traveler UID",    r.travelerUid      || "—"],
    ["Package Type",    r.packageType      || "—"],
    ["Weight",          r.weight           || "—"],
    ["From",            r.fromCity         || "—"],
    ["To",              r.toCity || r.destination || "—"],
    ["Proposed Payment",r.proposedPayment ? r.proposedPayment + " $" : "—"],
    ["Package Note",    r.packageNote      || "—"],
    ["Status",          r.requestStatus    || "—"],
    ["Parcel ID",       r.parcelId         || "—"],
    ["Trip ID",         r.tripId           || "—"],
    ["Submitted",       fmt(r.createdAt)],
  ]);
};

// ══════════════════════════════════════════════════════════════════════════════
// ── PAGE: REPORTS ─────────────────────────────────────────────────────────────
// Firestore collection: "reports"
// ══════════════════════════════════════════════════════════════════════════════
function reports() {
  const unsub = onSnapshot(
    query(collection(db, "reports"), orderBy("createdAt", "desc")),
    snap => {
      const rows = snap.docs.map(doc => {
        const r = { _docId: doc.id, ...doc.data() };
        return `
          <tr>
            <td><strong>${r.type     || "—"}</strong></td>
            <td>${r.reportedBy       || "—"}</td>
            <td>${r.targetUser || r.targetId || "—"}</td>
            <td style="max-width:220px;white-space:normal;font-size:13px;color:var(--muted);">
              ${r.reason || r.message || "—"}
            </td>
            <td>${badge(r.status || "pending")}</td>
            <td>${fmt(r.createdAt)}</td>
            <td>
              <button class="action-btn gold"
                onclick='viewReportModal(${enc(r)})'>View</button>
            </td>
          </tr>`;
      }).join("");

      contentEl.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <h2>Reports
              <span style="font-size:14px;color:var(--muted);font-weight:600;margin-left:8px;">
                ${snap.size} total
              </span>
            </h2>
          </div>
          <div class="table-wrapper">
            <table>
              <tr>
                <th>Type</th><th>Reported By</th><th>Target</th>
                <th>Reason</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
              ${rows || emptyState("fa-flag", "No reports", "All clear!")}
            </table>
          </div>
        </div>`;
    }
  );
  activeListeners.push(unsub);
}

window.viewReportModal = function(jsonStr) {
  const r = JSON.parse(jsonStr);
  viewDetail("Report Details", [
    ["Report ID",    r._docId              || "—"],
    ["Type",         r.type                || "—"],
    ["Reported By",  r.reportedBy          || "—"],
    ["Reporter UID", r.reporterUid         || "—"],
    ["Target",       r.targetUser || r.targetId || "—"],
    ["Reason",       r.reason || r.message || "—"],
    ["Status",       r.status              || "—"],
    ["Date",         fmt(r.createdAt)],
  ]);
};

// ══════════════════════════════════════════════════════════════════════════════
// ── PAGE: NOTIFICATIONS ───────────────────────────────────────────────────────
// Firestore collection: "notifications"
// ══════════════════════════════════════════════════════════════════════════════
function notifications() {
  const unsub = onSnapshot(
    query(collection(db, "notifications"), orderBy("createdAt", "desc")),
    snap => {
      const all         = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
      const unreadCount = all.filter(n => !n.read).length;
      const readCount   = all.filter(n =>  n.read).length;

      const rows = all.map(n => `
        <tr>
          <td><strong>${n.type    || "—"}</strong></td>
          <td>${n.title           || "—"}</td>
          <td style="max-width:240px;white-space:normal;font-size:13px;color:var(--muted);">
            ${n.message           || "—"}
          </td>
          <td>${badge(n.read ? "resolved" : "pending", n.read ? "Read" : "Unread")}</td>
          <td>${fmt(n.createdAt)}</td>
          <td>
            <button class="action-btn gold"
              onclick='viewNotifModal(${enc(n)})'>View</button>
          </td>
        </tr>`).join("");

      contentEl.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <h2>Notifications
              <span style="font-size:14px;color:var(--muted);font-weight:600;margin-left:8px;">
                ${unreadCount} unread · ${readCount} read · ${snap.size} total
              </span>
            </h2>
          </div>
          <div class="table-wrapper">
            <table>
              <tr>
                <th>Type</th><th>Title</th><th>Message</th>
                <th>Status</th><th>Date</th><th>Actions</th>
              </tr>
              ${rows || emptyState("fa-bell", "No notifications", "All clear!")}
            </table>
          </div>
        </div>`;
    }
  );
  activeListeners.push(unsub);
}

window.viewNotifModal = function(jsonStr) {
  const n = JSON.parse(jsonStr);
  viewDetail("Notification Details", [
    ["Notification ID",  n._docId       || "—"],
    ["Type",             n.type         || "—"],
    ["Title",            n.title        || "—"],
    ["Message",          n.message      || "—"],
    ["Read",             n.read ? "Yes" : "No"],
    ["Recipient UID",    n.uid          || "—"],
    ["From UID",         n.fromUid      || "—"],
    ["From Name",        n.fromName     || "—"],
    ["Request ID",       n.requestId    || "—"],
    ["Parcel ID",        n.parcelId     || "—"],
    ["Trip ID",          n.tripId       || "—"],
    ["Date",             fmt(n.createdAt)],
  ]);
};

// ══════════════════════════════════════════════════════════════════════════════
// ── PAGE: SETTINGS ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function settings() {
  contentEl.innerHTML = `
    <div class="panel settings-card">
      <div class="panel-header"><h2>Admin Settings</h2></div>

      <div class="settings-section">
        <h3>Personal Information</h3>
        <div class="form-group">
          <label>Admin Name</label>
          <input type="text" id="s-name" value="LinkAir Admin">
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="s-email" value="admin@linkair.com">
        </div>
        <div class="form-group">
          <label>Role</label>
          <select>
            <option>Super Admin</option>
            <option>Support Admin</option>
            <option>Operations Admin</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h3>Platform Preferences</h3>
        <div class="form-group">
          <label>Platform Name</label>
          <input type="text" value="LinkAir">
        </div>
        <div class="form-group">
          <label>Default Currency</label>
          <select>
            <option>USD — US Dollar</option>
            <option>DZD — Algerian Dinar</option>
            <option>EUR — Euro</option>
          </select>
        </div>
        <div class="form-group">
          <label>Timezone</label>
          <select>
            <option>GMT+1 — Algiers</option>
            <option>GMT+0 — London</option>
            <option>GMT+3 — Dubai</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h3>Notifications</h3>
        <div class="toggle-row">
          <div>
            <label>Email Notifications</label>
            <span>Receive alerts for new reports and requests</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" checked>
            <span class="slider"></span>
          </label>
        </div>
        <div class="toggle-row">
          <div>
            <label>Auto-approve verified users</label>
            <span>Automatically approve verified accounts</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox">
            <span class="slider"></span>
          </label>
        </div>
        <div class="toggle-row">
          <div>
            <label>Maintenance Mode</label>
            <span>Temporarily disable user access to the platform</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox">
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h3>Security</h3>
        <div class="form-group">
          <label>New Password</label>
          <input type="password" placeholder="Leave blank to keep current">
        </div>
        <div class="form-group">
          <label>Confirm Password</label>
          <input type="password" placeholder="Repeat new password">
        </div>
      </div>

      <button class="save-btn"
        onclick="showToast('Settings saved successfully ✓','success')">
        <i class="fa-solid fa-floppy-disk"></i> Save Changes
      </button>
    </div>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── EMPTY STATE HELPER ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function emptyState(icon, title, sub = "") {
  return `
    <tr>
      <td colspan="10">
        <div class="empty-state">
          <i class="fa-solid ${icon}"></i>
          <h3>${title}</h3>
          ${sub ? `<p>${sub}</p>` : ""}
        </div>
      </td>
    </tr>`;
}