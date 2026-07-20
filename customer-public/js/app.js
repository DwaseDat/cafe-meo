const API = 'http://localhost:3000/api';
let cart = [];
let customerId = localStorage.getItem('cafe_meo_customer') || null;

// Ánh xạ category → tiếng Việt + icon
const CATEGORY_MAP = {
  'drink':    { label: 'Thức Uống', icon: '☕' },
  'food':     { label: 'Đồ Ăn',    icon: '🍰' },
  'coffee':   { label: 'Cà Phê',   icon: '☕' },
  'tea':      { label: 'Trà',      icon: '🍵' },
  'smoothie': { label: 'Sinh Tố',  icon: '🥤' },
  'juice':    { label: 'Nước Ép',  icon: '🍊' },
};

// ── Chuyển tab ──
function switchView(id) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelector(`[data-view="${id}"]`)?.classList.add('active');
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// ── Load thực đơn ──
async function loadMenu() {
  const res = await fetch(`${API}/menu`);
  const items = await res.json();

  // Nhóm theo category
  const grouped = {};
  items.forEach(item => {
    const key = item.category || 'drink';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  const container = document.getElementById('menuContainer');
  container.innerHTML = Object.entries(grouped).map(([cat, list]) => {
    const info = CATEGORY_MAP[cat] || { label: cat, icon: '🍽️' };
    return `
      <div class="menu-category">
        <div class="category-header">
          <span class="category-label">${info.icon} ${info.label}</span>
        </div>
        <div class="menu-list">
          ${list.map(item => `
            <div class="menu-item" onclick="addToCart(${item.item_id}, '${item.name.replace(/'/g,"\\'")}', ${item.base_price})">
              <div class="menu-item-left">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-sub">Còn: ${item.stock_quantity} phần</div>
              </div>
              <div class="menu-item-dots"></div>
              <div class="menu-item-right">
                <span class="menu-item-price">${Number(item.base_price).toLocaleString('vi-VN')}₫</span>
                <button class="add-btn" onclick="event.stopPropagation(); addToCart(${item.item_id}, '${item.name.replace(/'/g,"\\'")}', ${item.base_price})">+</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ── Load mèo ──
async function loadCats() {
  const res = await fetch(`${API}/cats`);
  const cats = await res.json();
  const avatars = ['😸','🐱','😺','🐈','😻','🐾'];
  document.getElementById('catGrid').innerHTML = cats.map((cat, i) => `
    <div class="cat-card">
      <span class="cat-avatar">${avatars[i % avatars.length]}</span>
      <div class="cat-name">${cat.name}</div>
      <span class="cat-badge">${cat.breed_name}</span>
      <div class="cat-desc">${cat.temperament_description || ''}</div>
      <div class="cat-info">
        Giới tính: ${cat.gender || 'Chưa cập nhật'} &nbsp;·&nbsp;
        Sức khỏe: ${cat.current_health_status || 'Tốt'}
      </div>
    </div>
  `).join('');
}

// ── Giỏ hàng ──
function addToCart(item_id, name, price) {
  const existing = cart.find(c => c.item_id === item_id);
  if (existing) existing.quantity++;
  else cart.push({ item_id, name, price, quantity: 1 });
  renderCart();
}

function renderCart() {
  const panel = document.getElementById('cartPanel');
  if (cart.length === 0) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  let total = 0;
  document.getElementById('cartItems').innerHTML = cart.map(c => {
    total += c.price * c.quantity;
    return `<div class="cart-item">
      <span>${c.name} ×${c.quantity}</span>
      <span>${(c.price * c.quantity).toLocaleString('vi-VN')}₫</span>
    </div>`;
  }).join('');
  document.getElementById('cartTotal').textContent = total.toLocaleString('vi-VN') + '₫';
}

document.getElementById('checkoutBtn').addEventListener('click', async () => {
  const msg = document.getElementById('orderMsg');
  if (!customerId) {
    msg.innerHTML = '<div class="msg error">Vui lòng đặt bàn trước để chúng tôi biết thông tin của bạn!</div>';
    return;
  }
  const res = await fetch(`${API}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: customerId, items: cart.map(c => ({ item_id: c.item_id, quantity: c.quantity })) })
  });
  const data = await res.json();
  if (res.ok) {
    msg.innerHTML = `<div class="msg success">✅ Đặt món thành công! Đơn #${data.order_id} — Tổng: ${Number(data.total_amount).toLocaleString('vi-VN')}₫</div>`;
    cart = [];
    renderCart();
    loadMenu(); // cập nhật stock
  } else {
    msg.innerHTML = `<div class="msg error">❌ ${data.error || 'Có lỗi xảy ra, vui lòng thử lại!'}</div>`;
  }
});

// ── Form đặt bàn ──
document.getElementById('datBanForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('resMsg');
  msg.innerHTML = '<div class="msg">Đang xử lý...</div>';

  const custRes = await fetch(`${API}/customer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('resName').value,
      phone_number: document.getElementById('resPhone').value,
      email: document.getElementById('resEmail').value
    })
  });
  const custData = await custRes.json();
  customerId = custData.customer_id;
  localStorage.setItem('cafe_meo_customer', customerId);

  const resRes = await fetch(`${API}/reservation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: customerId,
      table_number: document.getElementById('resTable').value,
      reservation_date_time: document.getElementById('resDateTime').value,
      number_of_guests: document.getElementById('resGuests').value
    })
  });
  const resData = await resRes.json();

  if (resRes.ok) {
    msg.innerHTML = `<div class="msg success">🎉 Đặt bàn thành công! Mã đặt bàn #${resData.reservation_id}. Bạn có thể vào tab Thực Đơn để đặt món trước!</div>`;
    e.target.reset();
  } else {
    msg.innerHTML = `<div class="msg error">❌ Đặt bàn thất bại, vui lòng thử lại!</div>`;
  }
});

// ── Khởi động ──
loadMenu();
loadCats();

// Tự động cập nhật menu mỗi 30 giây
setInterval(loadMenu, 30000);
