// ── AUTH ──────────────────────────────────────────────────────────────────────
const ADMIN_EMAIL    = "admin@linkair.com";
const ADMIN_PASSWORD = "admin123";

const loginScreen = document.getElementById("loginScreen");
const adminApp    = document.getElementById("adminApp");
const loginForm   = document.getElementById("loginForm");
const loginError  = document.getElementById("loginError");
const logoutBtn   = document.getElementById("logoutBtn");
const togglePw    = document.getElementById("togglePw");
const loginPwInput = document.getElementById("loginPassword");

togglePw.addEventListener("click", () => {
  const isText = loginPwInput.type === "text";
  loginPwInput.type = isText ? "password" : "text";
  togglePw.className = isText ? "fa-solid fa-eye toggle-pw" : "fa-solid fa-eye-slash toggle-pw";
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
      { label: "Cancel", cls: "btn-cancel", cb: closeModal },
      { label: "Log Out", cls: "btn-danger", cb: () => {
        closeModal();
        adminApp.classList.add("hidden");
        loginScreen.classList.remove("hidden");
        loginForm.reset();
      }}
    ]
  });
});

// ── SIDEBAR TOGGLE ────────────────────────────────────────────────────────────
document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// ── NAVIGATION ────────────────────────────────────────────────────────────────
const content    = document.getElementById("content");
const pageTitle  = document.getElementById("pageTitle");
const pageSub    = document.getElementById("pageSubtitle");
const menuItems  = document.querySelectorAll(".nav-menu li");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");

const subtitles = {
  dashboard: "Monitor LinkAir platform activity and safety.",
  users:     "View, search, activate or suspend user accounts.",
  parcels:   "Monitor parcel status and manage shipments.",
  trips:     "Oversee traveler trips and available space.",
  requests:  "Review delivery requests.",
  reports:   "Handle reported issues and content moderation.",
  settings:  "Manage your admin account and platform preferences."
};

function loadPage(page) {
  content.innerHTML = pages[page] || "<p>Page not found.</p>";
  pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);
  pageSub.textContent   = subtitles[page] || "";
  searchInput.value     = "";
  clearSearch.classList.add("hidden");
  document.getElementById("sidebar").classList.remove("open");
}

menuItems.forEach(item => {
  item.addEventListener("click", () => {
    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    loadPage(item.getAttribute("data-page"));
  });
});

// ── SEARCH ────────────────────────────────────────────────────────────────────
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

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast" + (type ? " " + type : "");
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
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
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });

// ── HELPERS ───────────────────────────────────────────────────────────────────
function confirmAction(msg, onConfirm, danger = true) {
  showModal({
    title: "Confirm Action",
    body: `<p>${msg}</p>`,
    actions: [
      { label: "Cancel",  cls: "btn-cancel", cb: closeModal },
      { label: "Confirm", cls: danger ? "btn-danger" : "btn-confirm", cb: () => { closeModal(); onConfirm(); } }
    ]
  });
}

function viewDetail(title, rows) {
  const body = rows.map(([k, v]) => `
    <div class="modal-detail-row">
      <span>${k}</span><span>${v}</span>
    </div>`).join("");
  showModal({ title, body, actions: [{ label: "Close", cls: "btn-cancel", cb: closeModal }] });
}

// ── DATA STORE (in-memory) ────────────────────────────────────────────────────
const db = {
  users: [
    { id:1, name:"Sarah Ahmed",  email:"sarah@gmail.com",  role:"Sender",   verified:"Verified", status:"active"  },
    { id:2, name:"Yacine Ben",   email:"yacine@gmail.com", role:"Traveler", verified:"Pending",  status:"pending" },
    { id:3, name:"Nour K.",      email:"nour@gmail.com",   role:"Traveler", verified:"Verified", status:"active"  },
    { id:4, name:"Karim M.",     email:"karim@gmail.com",  role:"Sender",   verified:"Verified", status:"blocked" },
    { id:5, name:"Amira D.",     email:"amira@gmail.com",  role:"Sender",   verified:"Pending",  status:"active"  },
  ],
  parcels: [
    { id:1, type:"Documents",        sender:"Sarah Ahmed",  route:"Algiers → Paris",   price:"$35", status:"transit"  },
    { id:2, type:"Gift Box",         sender:"Amira D.",     route:"Oran → Istanbul",   price:"$50", status:"pending"  },
    { id:3, type:"Small Electronics",sender:"Karim M.",     route:"Algiers → Dubai",   price:"$80", status:"active"   },
    { id:4, type:"Clothes",          sender:"Nour K.",      route:"Paris → Algiers",   price:"$25", status:"transit"  },
  ],
  trips: [
    { id:1, traveler:"Yacine Ben", from:"Algiers", to:"Dubai",   flight:"EK758",   space:"8 kg",  status:"active"  },
    { id:2, traveler:"Nour K.",    from:"Paris",   to:"Algiers", flight:"AH1007",  space:"5 kg",  status:"pending" },
    { id:3, traveler:"Rania S.",   from:"Istanbul",to:"Oran",    flight:"TK493",   space:"10 kg", status:"active"  },
  ],
  requests: [
    { id:1, sender:"Sarah Ahmed", traveler:"Yacine Ben", parcel:"Documents", route:"Algiers → Dubai",  status:"pending"  },
    { id:2, sender:"Amira D.",    traveler:"Nour K.",    parcel:"Gift Box",   route:"Paris → Algiers",  status:"active"   },
    { id:3, sender:"Karim M.",    traveler:"Rania S.",   parcel:"Electronics",route:"Algiers → Istanbul",status:"pending"  },
  ],
  reports: [
    { id:1, by:"Amira D.",    against:"Karim M. (Traveler)",   reason:"Delayed delivery",        status:"pending"  },
    { id:2, by:"Sarah Ahmed", against:"Lina R. (Sender)",      reason:"Incorrect parcel details", status:"resolved" },
    { id:3, by:"Nour K.",     against:"Yacine Ben (Traveler)", reason:"Parcel not delivered",    status:"pending"  },
  ]
};

// ── STATUS BADGE ──────────────────────────────────────────────────────────────
function badge(s, label) {
  const map = { active:"Active", pending:"Pending", blocked:"Blocked", transit:"In Transit", resolved:"Resolved" };
  return `<span class="status ${s}">${label || map[s] || s}</span>`;
}

// ── PAGES ─────────────────────────────────────────────────────────────────────
const pages = {};

// DASHBOARD
pages.dashboard = `
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
      <h3>Total Users</h3>
      <h2>${db.users.length + 1243}</h2>
      <p>+12% this month</p>
    </div>
    <div class="stat-card">
      <div class="stat-icon"><i class="fa-solid fa-box"></i></div>
      <h3>Active Parcels</h3>
      <h2>${db.parcels.length + 322}</h2>
      <p>+8% this week</p>
    </div>
    <div class="stat-card">
      <div class="stat-icon"><i class="fa-solid fa-plane"></i></div>
      <h3>Traveler Trips</h3>
      <h2>${db.trips.length + 181}</h2>
      <p>+21 new trips</p>
    </div>
    <div class="stat-card">
      <div class="stat-icon"><i class="fa-solid fa-flag"></i></div>
      <h3>Open Reports</h3>
      <h2>${db.reports.filter(r=>r.status==="pending").length}</h2>
      <p>Needs review</p>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:22px;">
    <div class="panel">
      <div class="panel-header"><h2>Weekly Activity</h2></div>
      <div class="mini-chart">
        ${[60,75,55,90,80,95,70].map((h,i)=>{
          const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
          return `<div class="bar" style="height:${h}%"><span>${days[i]}</span></div>`;
        }).join("")}
      </div>
      <div style="height:24px"></div>
    </div>
    <div class="panel">
      <div class="panel-header"><h2>Quick Actions</h2></div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${[
          ["fa-users","Review pending users","users"],
          ["fa-handshake","View delivery requests","requests"],
          ["fa-flag","Handle open reports","reports"],
          ["fa-gear","Platform settings","settings"]
        ].map(([icon,label,page])=>`
          <div onclick="gotoPage('${page}')" style="display:flex;align-items:center;gap:12px;padding:13px 16px;background:#fafaf8;border-radius:14px;cursor:pointer;border:1px solid #f0f0f0;font-weight:600;font-size:14px;transition:background 0.2s;" onmouseover="this.style.background='#f6efd2'" onmouseout="this.style.background='#fafaf8'">
            <div style="width:36px;height:36px;background:var(--gold-soft);color:var(--gold);border-radius:10px;display:flex;align-items:center;justify-content:center;">
              <i class="fa-solid ${icon}"></i>
            </div>
            ${label}
            <i class="fa-solid fa-chevron-right" style="margin-left:auto;color:#ccc;font-size:12px;"></i>
          </div>
        `).join("")}
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-header"><h2>Recent Platform Activity</h2></div>
    <div class="table-wrapper">
      <table>
        <tr><th>User</th><th>Activity</th><th>Route</th><th>Status</th><th>Date</th></tr>
        <tr><td>Sarah Ahmed</td><td>Posted parcel request</td><td>Algiers → Paris</td><td>${badge("pending")}</td><td>Today</td></tr>
        <tr><td>Yacine Ben</td><td>Accepted delivery</td><td>Algiers → Dubai</td><td>${badge("active")}</td><td>Today</td></tr>
        <tr><td>Amira D.</td><td>Reported delivery issue</td><td>Oran → Istanbul</td><td>${badge("blocked","Review")}</td><td>Yesterday</td></tr>
        <tr><td>Nour K.</td><td>Trip posted</td><td>Paris → Algiers</td><td>${badge("pending")}</td><td>Yesterday</td></tr>
      </table>
    </div>
  </div>
`;

// USERS
function renderUsers() {
  const rows = db.users.map(u => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>${u.verified}</td>
      <td>${badge(u.status)}</td>
      <td>
        <button class="action-btn gold" onclick='viewUser(${u.id})'>View</button>
        <button class="action-btn ${u.status==="blocked"?"success":"danger"}" onclick='toggleUser(${u.id})'>
          ${u.status==="blocked" ? "Activate" : "Suspend"}
        </button>
      </td>
    </tr>`).join("");

  return `
    <div class="panel">
      <div class="panel-header">
        <h2>Users Management</h2>
        <button class="add-btn" onclick="showToast('User list exported ✓','success')"><i class="fa-solid fa-download"></i> Export</button>
      </div>
      <div class="table-wrapper">
        <table>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Verification</th><th>Status</th><th>Actions</th></tr>
          ${rows}
        </table>
      </div>
    </div>`;
}
pages.users = renderUsers();

function viewUser(id) {
  const u = db.users.find(x => x.id === id);
  if (!u) return;
  viewDetail(`User — ${u.name}`, [
    ["Full Name", u.name],
    ["Email", u.email],
    ["Role", u.role],
    ["Verification", u.verified],
    ["Account Status", u.status.charAt(0).toUpperCase() + u.status.slice(1)]
  ]);
}

function toggleUser(id) {
  const u = db.users.find(x => x.id === id);
  if (!u) return;
  const action = u.status === "blocked" ? "activate" : "suspend";
  confirmAction(`Are you sure you want to <strong>${action}</strong> ${u.name}'s account?`, () => {
    u.status = u.status === "blocked" ? "active" : "blocked";
    pages.users = renderUsers();
    loadPage("users");
    showToast(`${u.name} has been ${action}d.`, action === "activate" ? "success" : "danger");
  }, action !== "activate");
}

// PARCELS
function renderParcels() {
  const rows = db.parcels.map(p => `
    <tr>
      <td><strong>${p.type}</strong></td>
      <td>${p.sender}</td>
      <td>${p.route}</td>
      <td>${p.price}</td>
      <td>${badge(p.status)}</td>
      <td>
        <button class="action-btn gold" onclick='viewParcel(${p.id})'>Details</button>
        <button class="action-btn" onclick="showToast('Tracking info shown','')">Track</button>
      </td>
    </tr>`).join("");

  return `
    <div class="panel">
      <div class="panel-header">
        <h2>Parcels Management</h2>
        <button class="add-btn" onclick="showToast('Parcels exported ✓','success')"><i class="fa-solid fa-download"></i> Export</button>
      </div>
      <div class="table-wrapper">
        <table>
          <tr><th>Parcel</th><th>Sender</th><th>Route</th><th>Price</th><th>Status</th><th>Actions</th></tr>
          ${rows}
        </table>
      </div>
    </div>`;
}
pages.parcels = renderParcels();

function viewParcel(id) {
  const p = db.parcels.find(x => x.id === id);
  if (!p) return;
  viewDetail(`Parcel — ${p.type}`, [
    ["Type", p.type],
    ["Sender", p.sender],
    ["Route", p.route],
    ["Price", p.price],
    ["Status", p.status]
  ]);
}

// TRIPS
function renderTrips() {
  const rows = db.trips.map(t => `
    <tr>
      <td><strong>${t.traveler}</strong></td>
      <td>${t.from}</td>
      <td>${t.to}</td>
      <td>${t.flight}</td>
      <td>${t.space}</td>
      <td>${badge(t.status, t.status === "active" ? "Available" : "Pending")}</td>
      <td>
        <button class="action-btn gold" onclick='viewTrip(${t.id})'>Details</button>
      </td>
    </tr>`).join("");

  return `
    <div class="panel">
      <div class="panel-header">
        <h2>Traveler Trips</h2>
        <button class="add-btn" onclick="showToast('Trips exported ✓','success')"><i class="fa-solid fa-download"></i> Export</button>
      </div>
      <div class="table-wrapper">
        <table>
          <tr><th>Traveler</th><th>From</th><th>To</th><th>Flight</th><th>Space</th><th>Status</th><th>Actions</th></tr>
          ${rows}
        </table>
      </div>
    </div>`;
}
pages.trips = renderTrips();

function viewTrip(id) {
  const t = db.trips.find(x => x.id === id);
  if (!t) return;
  viewDetail(`Trip — ${t.traveler}`, [
    ["Traveler", t.traveler],
    ["From", t.from],
    ["To", t.to],
    ["Flight", t.flight],
    ["Available Space", t.space],
    ["Status", t.status]
  ]);
}

// REQUESTS
function renderRequests() {
  const rows = db.requests.map(r => `
    <tr>
      <td>${r.sender}</td>
      <td>${r.traveler}</td>
      <td>${r.parcel}</td>
      <td>${r.route}</td>
      <td>${badge(r.status, r.status === "pending" ? "Pending" : "Accepted")}</td>
      <td>
        <button class="action-btn gold" onclick='viewRequest(${r.id})'>View</button>
      </td>
    </tr>`).join("");

  return `
    <div class="panel">
      <div class="panel-header">
        <h2>Delivery Requests</h2>
        <button class="add-btn" onclick="showToast('Requests exported ✓','success')"><i class="fa-solid fa-download"></i> Export</button>
      </div>
      <div class="table-wrapper">
        <table>
          <tr><th>Sender</th><th>Traveler</th><th>Parcel</th><th>Route</th><th>Status</th><th>Actions</th></tr>
          ${rows}
        </table>
      </div>
    </div>`;
}
pages.requests = renderRequests();

function viewRequest(id) {
  const r = db.requests.find(x => x.id === id);
  if (!r) return;
  viewDetail("Delivery Request", [
    ["Sender",   r.sender],
    ["Traveler", r.traveler],
    ["Parcel",   r.parcel],
    ["Route",    r.route],
    ["Status",   r.status]
  ]);
}

// REPORTS
function renderReports() {
  const rows = db.reports.map(r => `
    <tr>
      <td>${r.by}</td>
      <td>${r.against}</td>
      <td>${r.reason}</td>
      <td>${badge(r.status, r.status === "pending" ? "Under Review" : "Resolved")}</td>
      <td>
        ${r.status === "pending"
          ? `<button class="action-btn gold"  onclick='resolveReport(${r.id})'>Resolve</button>
             <button class="action-btn danger" onclick='deleteReport(${r.id})'>Delete</button>`
          : `<button class="action-btn gold"   onclick='viewReport(${r.id})'>View</button>
             <button class="action-btn danger"  onclick='deleteReport(${r.id})'>Delete</button>`
        }
      </td>
    </tr>`).join("");

  return `
    <div class="panel">
      <div class="panel-header">
        <h2>Reports & Safety</h2>
        <span style="font-size:13px;color:var(--muted);font-weight:600;">
          ${db.reports.filter(r=>r.status==="pending").length} open · ${db.reports.filter(r=>r.status==="resolved").length} resolved
        </span>
      </div>
      <div class="table-wrapper">
        <table>
          <tr><th>Reported By</th><th>Against</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
          ${rows.length ? rows : `<tr><td colspan="5"><div class="empty-state"><i class="fa-solid fa-flag"></i><h3>No reports</h3><p>All clear!</p></div></td></tr>`}
        </table>
      </div>
    </div>`;
}
pages.reports = renderReports();

function resolveReport(id) {
  const r = db.reports.find(x => x.id === id);
  if (!r) return;
  confirmAction(`Mark this report by <strong>${r.by}</strong> as resolved?`, () => {
    r.status = "resolved";
    pages.reports = renderReports();
    loadPage("reports");
    showToast("Report marked as resolved ✓", "success");
  }, false);
}

function deleteReport(id) {
  const r = db.reports.find(x => x.id === id);
  if (!r) return;
  confirmAction(`Permanently delete this report by <strong>${r.by}</strong>?`, () => {
    db.reports.splice(db.reports.indexOf(r), 1);
    pages.reports = renderReports();
    loadPage("reports");
    showToast("Report deleted.", "danger");
  });
}

function viewReport(id) {
  const r = db.reports.find(x => x.id === id);
  if (!r) return;
  viewDetail("Report Details", [
    ["Reported By", r.by],
    ["Against",     r.against],
    ["Reason",      r.reason],
    ["Status",      r.status]
  ]);
}

// SETTINGS
pages.settings = `
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

    <button class="save-btn" onclick="showToast('Settings saved successfully ✓','success')">
      <i class="fa-solid fa-floppy-disk"></i> Save Changes
    </button>
  </div>
`;

// ── HELPERS FOR NAVIGATION FROM QUICK ACTIONS ─────────────────────────────────
function gotoPage(page) {
  menuItems.forEach(i => {
    i.classList.toggle("active", i.getAttribute("data-page") === page);
  });
  loadPage(page);
}

// ── INIT ──────────────────────────────────────────────────────────────────────
// (page loaded on login submit)