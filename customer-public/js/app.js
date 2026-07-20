const API = 'http://localhost:3000/api';
let cart = [];
let customerId = localStorage.getItem('cafe_meo_customer') || null;
let allMenuItems = [];
let activeCategory = null;

// ── Bộ icon dạng nét vẽ (line-icon), không dùng emoji ──
const ICONS = {
  coffee: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3.5c-.6.7-.6 1.3 0 2s.6 1.3 0 2M12 3.5c-.6.7-.6 1.3 0 2s.6 1.3 0 2"/></svg>`,
  tea: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M17 10h1.5a2 2 0 0 1 0 4H17"/><path d="M9 3c1.5 1.5 1.5 3 0 4.5"/><path d="M13 3c1.5 1.5 1.5 3 0 4.5"/></svg>`,
  tea_pot: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h2l2.5-2.5H15L17 12h2"/><path d="M5 12v3a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-3"/><path d="M18 11.5c1.8-.3 3 .6 3 1.8s-1 2-2.3 2"/><circle cx="10.5" cy="5.5" r="1.4"/></svg>`,
  juice: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 6h10l-1 13a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2L7 6z"/><path d="M7 6l-1-3M17 6l1-3M9 6V3M15 6V3"/><path d="M16.5 10c-2 1-3 1-5 0s-3-1-4.5 0"/></svg>`,
  smoothie: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5h12l-1.4 13.5a2 2 0 0 1-2 1.8h-5.2a2 2 0 0 1-2-1.8L6 5z"/><path d="M4.5 5h15"/><path d="M15 2l1.5 3"/><path d="M9 9.5h6M9.5 13h5"/></svg>`,
  coldbrew: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6v3.5L17 9v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9l2-3.5V2z"/><path d="M7.3 9h9.4"/><rect x="10" y="12" width="2.4" height="2.4" rx="0.4"/><rect x="12.8" y="15" width="2.2" height="2.2" rx="0.4"/></svg>`,
  food: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11a9 9 0 0 1 18 0z"/><path d="M3 11h18l-1.2 6.5a2 2 0 0 1-2 1.5H6.2a2 2 0 0 1-2-1.5L3 11z"/><path d="M9 11v-1M12 11V9M15 11v-1"/></svg>`,
  drink: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/></svg>`
};

// Ánh xạ category → tiếng Việt + icon, theo đúng thứ tự hiển thị sidebar
const CATEGORY_ORDER = ['coffee', 'tea', 'tea_pot', 'juice', 'smoothie', 'coldbrew', 'food', 'drink'];
const CATEGORY_MAP = {
  'coffee':   { label: 'Cà Phê' },
  'tea':      { label: 'Trà' },
  'tea_pot':  { label: 'Ấm Trà Nóng' },
  'juice':    { label: 'Nước Ép' },
  'smoothie': { label: 'Sinh Tố' },
  'coldbrew': { label: 'Cold Brew' },
  'food':     { label: 'Đồ Ăn' },
  'drink':    { label: 'Khác' },
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
  allMenuItems = await res.json();

  const presentCats = CATEGORY_ORDER.filter(c => allMenuItems.some(i => (i.category || 'drink') === c));
  if (!activeCategory || !presentCats.includes(activeCategory)) {
    activeCategory = presentCats[0] || null;
  }

  renderSidebar(presentCats);
  renderMenuGrid();
}

function renderSidebar(presentCats) {
  const sidebar = document.getElementById('menuSidebar');
  sidebar.innerHTML = presentCats.map(cat => {
    const meta = CATEGORY_MAP[cat] || { label: cat };
    const count = allMenuItems.filter(i => (i.category || 'drink') === cat).length;
    return `
      <button class="menu-cat-btn ${cat === activeCategory ? 'active' : ''}" data-cat="${cat}">
        ${ICONS[cat] || ICONS.drink}
        <span>${meta.label}</span>
        <span class="menu-cat-count">${count}</span>
      </button>`;
  }).join('');

  sidebar.querySelectorAll('.menu-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      renderSidebar(presentCats);
      renderMenuGrid();
    });
  });
}

function renderMenuGrid() {
  const container = document.getElementById('menuContainer');
  const items = allMenuItems.filter(i => (i.category || 'drink') === activeCategory);

  if (items.length === 0) {
    container.innerHTML = `<div class="menu-empty">Chưa có món nào trong danh mục này.</div>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="menu-card" onclick="addToCart(${item.item_id}, '${item.name.replace(/'/g, "\\'")}', ${item.base_price})">
      <div class="menu-card-art">${ICONS[item.category] || ICONS.drink}</div>
      <div class="menu-card-body">
        <div class="menu-card-name">${item.name}</div>
        <div class="menu-card-sub">Còn: ${item.stock_quantity} phần</div>
        <div class="menu-card-foot">
          <span class="menu-card-price">${Number(item.base_price).toLocaleString('vi-VN')}₫</span>
          <button class="add-btn" onclick="event.stopPropagation(); addToCart(${item.item_id}, '${item.name.replace(/'/g, "\\'")}', ${item.base_price})">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Sticker mèo vẽ tay bằng SVG (khác nhau theo giống, không dùng emoji) ──
const BREED_STYLE = {
  'British Shorthair': { fur: '#A9A29A', ear: '#E7C9B4', eye: '#4A6B4E', pattern: 'solid' },
  'Ragdoll':            { fur: '#F3ECDD', ear: '#D8A97E', eye: '#5C8FBE', pattern: 'points' },
  'Scottish Fold':      { fur: '#D9B382', ear: '#8B5E3C', eye: '#7A5A32', pattern: 'foldear' },
  'Persian':            { fur: '#F7F2E7', ear: '#C48A5A', eye: '#B98A3E', pattern: 'flat' },
  'Maine Coon':         { fur: '#8B5A2B', ear: '#4A2E14', eye: '#C4922A', pattern: 'tufted' },
  'Siamese':            { fur: '#F3ECDD', ear: '#3A2A1A', eye: '#6FA8C7', pattern: 'points' },
  'Sphynx':             { fur: '#D8B896', ear: '#B98A62', eye: '#8B3A1A', pattern: 'wrinkle' },
  'Munchkin':           { fur: '#E8A87C', ear: '#B9673C', eye: '#5A3E28', pattern: 'solid' },
  'Bengal':             { fur: '#D9A441', ear: '#7A4A1A', eye: '#3C6B3E', pattern: 'spots' },
};
const DEFAULT_STYLE = { fur: '#E8B57E', ear: '#B9673C', eye: '#5A3E28', pattern: 'solid' };

function catAvatarSVG(breedName) {
  const s = BREED_STYLE[breedName] || DEFAULT_STYLE;
  let markings = '';
  if (s.pattern === 'points') {
    markings = `<path d="M20 20 Q32 6 44 20 L38 30 Q32 24 26 30 Z" fill="${s.ear}" opacity="0.55"/>`;
  } else if (s.pattern === 'spots') {
    markings = `<circle cx="24" cy="30" r="2.6" fill="${s.ear}" opacity=".6"/><circle cx="40" cy="30" r="2.6" fill="${s.ear}" opacity=".6"/><circle cx="32" cy="40" r="2.3" fill="${s.ear}" opacity=".6"/>`;
  } else if (s.pattern === 'tufted') {
    markings = `<path d="M16 16 l3 -6 M48 16 l-3 -6" stroke="${s.ear}" stroke-width="2" stroke-linecap="round"/>`;
  } else if (s.pattern === 'wrinkle') {
    markings = `<path d="M24 26 q8 -3 16 0" stroke="${s.ear}" stroke-width="1.4" fill="none" opacity=".6"/>`;
  }

  const earTop = s.pattern === 'foldear'
    ? `<path d="M18 20 q4 -2 6 2" fill="${s.fur}" stroke="${s.ear}" stroke-width="1.2"/><path d="M46 20 q-4 -2 -6 2" fill="${s.fur}" stroke="${s.ear}" stroke-width="1.2"/>`
    : `<path d="M14 22 L20 8 L26 21 Z" fill="${s.fur}" stroke="${s.ear}" stroke-width="1.2"/>
       <path d="M50 22 L44 8 L38 21 Z" fill="${s.fur}" stroke="${s.ear}" stroke-width="1.2"/>
       <path d="M17 19 L20 12 L23 18.5 Z" fill="${s.ear}"/>
       <path d="M47 19 L44 12 L41 18.5 Z" fill="${s.ear}"/>`;

  return `
  <svg class="cat-avatar" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    ${earTop}
    <circle cx="32" cy="34" r="20" fill="${s.fur}" stroke="${s.ear}" stroke-width="1.2"/>
    ${markings}
    <circle cx="24" cy="33" r="2.6" fill="${s.eye}"/>
    <circle cx="40" cy="33" r="2.6" fill="${s.eye}"/>
    <path d="M30 40 q2 2 4 0" stroke="${s.ear}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M32 38 v2" stroke="${s.ear}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M12 36 L22 37 M12 40 L22 39" stroke="${s.ear}" stroke-width="1" opacity=".5"/>
    <path d="M52 36 L42 37 M52 40 L42 39" stroke="${s.ear}" stroke-width="1" opacity=".5"/>
  </svg>`;
}

// ── Load mèo ──
async function loadCats() {
  const res = await fetch(`${API}/cats`);
  const cats = await res.json();
  document.getElementById('catGrid').innerHTML = cats.map(cat => `
    <div class="cat-card">
      ${catAvatarSVG(cat.breed_name)}
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
