const API = 'http://localhost:4000/api';
let currentStaff = JSON.parse(sessionStorage.getItem('staff') || 'null');

if (currentStaff) showDashboard();

document.getElementById('loginBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (res.ok) {
    currentStaff = await res.json();
    sessionStorage.setItem('staff', JSON.stringify(currentStaff));
    showDashboard();
  } else {
    document.getElementById('loginMsg').textContent = 'Sai tên đăng nhập hoặc mật khẩu!';
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('staff');
  location.reload();
});

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';

  // Thêm nút Nhân Viên vào sidebar nếu là Manager
  if (currentStaff && currentStaff.role === 'Manager') {
    const sidebar = document.querySelector('.nav-logout');
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.dataset.panel = 'nhanvien';
    btn.textContent = '👤 Nhân Viên';
    sidebar.parentNode.insertBefore(btn, sidebar);
    btn.addEventListener('click', () => switchPanel('nhanvien'));
    loadStaff();
  }

  loadOverview();
  loadOrders();
  loadMenu();
  loadCatsAndBreeds();
  loadReservations();
  connectSocket();
}

// ── Sidebar navigation ──
document.querySelectorAll('.nav-btn[data-panel]').forEach(btn => {
  btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
});

function switchPanel(id) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel-view').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-panel="${id}"]`)?.classList.add('active');
  document.getElementById(id)?.classList.add('active');
}

// ── Real-time Socket.io ──
function connectSocket() {
  const socket = io('http://localhost:4000');

  socket.on('connect', () => showToast('🟢 Kết nối real-time thành công!', '#D8EFD8', '#2C5A29'));

  socket.on('new_order', (data) => {
    showToast(`🛒 Đơn hàng mới #${data.order_id} — ${Number(data.total_amount).toLocaleString('vi-VN')}₫`, '#F5E2C0', '#8A5A1A');
    loadOrders();
    loadOverview();
    loadMenu();
  });

  socket.on('new_reservation', (data) => {
    showToast(`📅 Đặt bàn mới — Bàn ${data.table_number}, ${data.number_of_guests} người`, '#D8E8F5', '#1A4A8A');
    loadReservations();
    loadOverview();
  });

  socket.on('order_updated', () => { loadOrders(); loadOverview(); });
  socket.on('menu_updated',  () => loadMenu());
  socket.on('reservation_updated', () => loadReservations());
}

function showToast(msg, bg, color) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  t.style.cssText = `background:${bg};color:${color};`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ── Tổng quan ──
async function loadOverview() {
  const res = await fetch(`${API}/stats`);
  const s = await res.json();
  document.getElementById('statGrid').innerHTML = `
    <div class="stat-card"><div class="stat-num">${s.orders}</div><div class="stat-label">Tổng Đơn Hàng</div></div>
    <div class="stat-card"><div class="stat-num">${Number(s.revenue).toLocaleString('vi-VN')}₫</div><div class="stat-label">Doanh Thu</div></div>
    <div class="stat-card"><div class="stat-num">${s.cats}</div><div class="stat-label">Mèo Trong Tiệm</div></div>
    <div class="stat-card"><div class="stat-num">${s.upcomingReservations}</div><div class="stat-label">Đặt Bàn Sắp Tới</div></div>
  `;
}

// ── Đơn hàng ──
async function loadOrders() {
  const res = await fetch(`${API}/orders`);
  const orders = await res.json();
  document.getElementById('ordersBody').innerHTML = orders.map(o => `
    <tr>
      <td>#${o.order_id}</td>
      <td>${o.customer_name}</td>
      <td>${o.staff_name || '—'}</td>
      <td>${new Date(o.order_date_time).toLocaleString('vi-VN')}</td>
      <td>${Number(o.total_amount).toLocaleString('vi-VN')}₫</td>
      <td><span class="badge ${o.status}">${o.status === 'pending' ? 'Chờ xử lý' : 'Hoàn thành'}</span></td>
      <td>${o.status === 'pending' ? `<button class="action-btn" onclick="hoanThanhDon(${o.order_id})">✔ Xong</button>` : ''}</td>
    </tr>
  `).join('');
}

async function hoanThanhDon(orderId) {
  await fetch(`${API}/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staff_id: currentStaff.staff_id, status: 'completed' })
  });
  loadOrders(); loadOverview();
}

// ── Thực đơn ──
async function loadMenu() {
  const res = await fetch(`${API}/menu`);
  const items = await res.json();
  const catMap = {
    drink: 'Khác',
    food: 'Đồ Ăn',
    coffee: 'Cà Phê',
    tea: 'Trà',
    tea_pot: 'Ấm Trà Nóng',
    smoothie: 'Sinh Tố',
    juice: 'Nước Ép',
    coldbrew: 'Cold Brew'
  };
  document.getElementById('menuBody').innerHTML = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${catMap[item.category] || item.category}</td>
      <td>
        <input type="number" value="${item.base_price}"
          onchange="capNhatMon(${item.item_id}, 'price', this.value)"
          style="width:90px;padding:4px;border:1px solid #B8A882;border-radius:2px;background:#F5EFE0;">
      </td>
      <td>
        <input type="number" value="${item.stock_quantity}"
          onchange="capNhatMon(${item.item_id}, 'stock', this.value)"
          style="width:70px;padding:4px;border:1px solid #B8A882;border-radius:2px;background:#F5EFE0;">
      </td>
      <td><button class="action-btn" onclick="xoaMon(${item.item_id})">Xóa</button></td>
    </tr>
  `).join('');
}

document.getElementById('menuForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  await fetch(`${API}/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('mName').value,
      base_price: document.getElementById('mPrice').value,
      stock_quantity: document.getElementById('mStock').value,
      category: document.getElementById('mCategory').value
    })
  });
  e.target.reset(); loadMenu();
});

async function xoaMon(id) {
  if (!confirm('Xác nhận xóa món này?')) return;
  await fetch(`${API}/menu/${id}`, { method: 'DELETE' });
  loadMenu();
}

async function capNhatMon(id, field, value) {
  await fetch(`${API}/menu/${id}/field`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, value })
  });
}

// ── Mèo ──
async function loadCatsAndBreeds() {
  const [catsRes, breedsRes] = await Promise.all([fetch(`${API}/cats`), fetch(`${API}/breeds`)]);
  const cats = await catsRes.json();
  const breeds = await breedsRes.json();

  document.getElementById('cBreed').innerHTML = breeds.map(b =>
    `<option value="${b.breed_id}">${b.name}</option>`
  ).join('');

  document.getElementById('catsBody').innerHTML = cats.map(c => `
    <tr>
      <td>${c.name}</td>
      <td>${c.breed_name}</td>
      <td>${c.gender || '—'}</td>
      <td>${c.care_level || '—'}</td>
      <td>${c.current_health_status || '—'}</td>
    </tr>
  `).join('');
}

document.getElementById('catForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  await fetch(`${API}/cats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('cName').value,
      breed_id: document.getElementById('cBreed').value,
      date_of_birth: document.getElementById('cDob').value || null,
      care_level: document.getElementById('cCare').value,
      current_health_status: 'Khỏe mạnh',
      dietary_restriction: 'Không có'
    })
  });
  e.target.reset(); loadCatsAndBreeds();
});

// ── Đặt bàn ──
async function loadReservations() {
  const res = await fetch(`${API}/reservations`);
  const list = await res.json();
  document.getElementById('reservationsBody').innerHTML = list.map(r => `
    <tr>
      <td>#${r.reservation_id}</td>
      <td>${r.customer_name}</td>
      <td>${r.phone_number || '—'}</td>
      <td>Bàn ${r.table_number}</td>
      <td>${new Date(r.reservation_date_time).toLocaleString('vi-VN')}</td>
      <td>${r.number_of_guests} người</td>
      <td>
        ${r.status === 'confirmed'
          ? '<span class="badge confirmed">✅ Đã xác nhận</span>'
          : `<button class="action-btn" onclick="xacNhanDatBan(${r.reservation_id})">✔ Xác Nhận</button>`
        }
      </td>
    </tr>
  `).join('');
}

async function xacNhanDatBan(id) {
  await fetch(`${API}/reservations/${id}/confirm`, { method: 'PUT' });
  loadReservations();
}

// ── Nhân viên ──
async function loadStaff() {
  const res = await fetch(`${API}/staff`);
  const list = await res.json();
  document.getElementById('staffBody').innerHTML = list.map(s => `
    <tr>
      <td>${s.name}</td>
      <td>${s.phone_number || '—'}</td>
      <td>${s.role || '—'}</td>
      <td>${s.username}</td>
    </tr>
  `).join('');
}

document.getElementById('staffForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  await fetch(`${API}/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('sName').value,
      phone_number: document.getElementById('sPhone').value,
      role: document.getElementById('sRole').value,
      username: document.getElementById('sUsername').value,
      password: document.getElementById('sPassword').value
    })
  });
  e.target.reset(); loadStaff();
});
