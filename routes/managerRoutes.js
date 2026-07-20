// routes/managerRoutes.js
const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// Staff login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const pool = await poolPromise;
  const result = await pool.request()
    .input('username', sql.VarChar, username)
    .input('password', sql.VarChar, password)
    .query('SELECT * FROM staff WHERE username = @username AND password = @password');
  if (result.recordset.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
  res.json(result.recordset[0]);
});

// Dashboard stats
router.get('/stats', async (req, res) => {
  const pool = await poolPromise;
  const orderCount = await pool.request().query('SELECT COUNT(*) AS count FROM [order]');
  const revenue = await pool.request().query('SELECT SUM(total_amount) AS total FROM [order]');
  const catCount = await pool.request().query('SELECT COUNT(*) AS count FROM cat');
  const reservationCount = await pool.request()
    .query("SELECT COUNT(*) AS count FROM reservation WHERE reservation_date_time >= CAST(GETDATE() AS DATE)");
  res.json({
    orders: orderCount.recordset[0].count,
    revenue: revenue.recordset[0].total || 0,
    cats: catCount.recordset[0].count,
    upcomingReservations: reservationCount.recordset[0].count
  });
});

// All orders — kèm danh sách tên món để nhân viên biết đã đặt gì
router.get('/orders', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT o.order_id, o.order_date_time, o.total_amount, o.status,
           c.name AS customer_name, s.name AS staff_name,
           STRING_AGG(CONCAT(m.name, N' x', oi.quantity), N', ') AS item_list
    FROM [order] o
    JOIN customer c ON o.customer_id = c.customer_id
    LEFT JOIN staff s ON o.staff_id = s.staff_id
    LEFT JOIN order_item oi ON oi.order_id = o.order_id
    LEFT JOIN menu m ON m.item_id = oi.item_id
    GROUP BY o.order_id, o.order_date_time, o.total_amount, o.status, c.name, s.name
    ORDER BY o.order_date_time DESC
  `);
  res.json(result.recordset);
});

// Update order status
router.put('/orders/:id', async (req, res) => {
  const { staff_id, status } = req.body;
  const pool = await poolPromise;
  await pool.request()
    .input('staff_id', sql.Int, staff_id)
    .input('status', sql.VarChar, status)
    .input('order_id', sql.Int, req.params.id)
    .query('UPDATE [order] SET staff_id = @staff_id, status = @status WHERE order_id = @order_id');

  const io = req.app.get('io');
  if (io) io.emit('order_updated', { order_id: req.params.id, status });

  res.json({ success: true });
});

// Menu management
router.get('/menu', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT * FROM menu ORDER BY category, name');
  res.json(result.recordset);
});

router.post('/menu', async (req, res) => {
  const { name, base_price, stock_quantity, category } = req.body;
  const pool = await poolPromise;
  const result = await pool.request()
    .input('name', sql.NVarChar, name)
    .input('base_price', sql.Decimal(10, 2), base_price)
    .input('stock_quantity', sql.Int, stock_quantity)
    .input('category', sql.VarChar, category)
    .query(`INSERT INTO menu (name, base_price, stock_quantity, category)
            OUTPUT INSERTED.item_id
            VALUES (@name, @base_price, @stock_quantity, @category)`);

  const io = req.app.get('io');
  if (io) io.emit('menu_updated');

  res.json({ item_id: result.recordset[0].item_id });
});

router.put('/menu/:id/field', async (req, res) => {
  const { field, value } = req.body;
  const pool = await poolPromise;
  if (field === 'price') {
    await pool.request()
      .input('value', sql.Decimal(10, 2), value)
      .input('id', sql.Int, req.params.id)
      .query('UPDATE menu SET base_price = @value WHERE item_id = @id');
  } else if (field === 'stock') {
    await pool.request()
      .input('value', sql.Int, value)
      .input('id', sql.Int, req.params.id)
      .query('UPDATE menu SET stock_quantity = @value WHERE item_id = @id');
  }

  const io = req.app.get('io');
  if (io) io.emit('menu_updated');

  res.json({ success: true });
});

router.delete('/menu/:id', async (req, res) => {
  const pool = await poolPromise;
  await pool.request()
    .input('item_id', sql.Int, req.params.id)
    .query('DELETE FROM menu WHERE item_id = @item_id');

  const io = req.app.get('io');
  if (io) io.emit('menu_updated');

  res.json({ success: true });
});

// Staff management
router.get('/staff', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .query('SELECT staff_id, name, phone_number, role, username FROM staff');
  res.json(result.recordset);
});

router.post('/staff', async (req, res) => {
  const { name, phone_number, role, username, password } = req.body;
  const pool = await poolPromise;
  const result = await pool.request()
    .input('name', sql.NVarChar, name)
    .input('phone_number', sql.VarChar, phone_number)
    .input('role', sql.NVarChar, role)
    .input('username', sql.VarChar, username)
    .input('password', sql.VarChar, password)
    .query(`INSERT INTO staff (name, phone_number, role, username, password)
            OUTPUT INSERTED.staff_id
            VALUES (@name, @phone_number, @role, @username, @password)`);
  res.json({ staff_id: result.recordset[0].staff_id });
});

// Cat management
router.get('/cats', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT cat.*, breed.name AS breed_name FROM cat
    JOIN breed ON cat.breed_id = breed.breed_id
  `);
  res.json(result.recordset);
});

router.post('/cats', async (req, res) => {
  const { breed_id, name, date_of_birth, care_level, current_health_status, dietary_restriction, gender } = req.body;
  const pool = await poolPromise;
  const result = await pool.request()
    .input('breed_id', sql.Int, breed_id)
    .input('name', sql.NVarChar, name)
    .input('date_of_birth', sql.Date, date_of_birth || null)
    .input('care_level', sql.NVarChar, care_level)
    .input('current_health_status', sql.NVarChar, current_health_status)
    .input('dietary_restriction', sql.NVarChar, dietary_restriction)
    .input('gender', sql.NVarChar, gender || null)
    .query(`INSERT INTO cat (breed_id, name, date_of_birth, care_level, current_health_status, dietary_restriction, gender)
            OUTPUT INSERTED.cat_id
            VALUES (@breed_id, @name, @date_of_birth, @care_level, @current_health_status, @dietary_restriction, @gender)`);

  const io = req.app.get('io');
  if (io) io.emit('cats_updated');

  res.json({ cat_id: result.recordset[0].cat_id });
});

// Cập nhật thông tin mèo (manager sửa từng trường)
router.put('/cats/:id', async (req, res) => {
  const { breed_id, name, date_of_birth, care_level, current_health_status, dietary_restriction, gender } = req.body;
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, req.params.id)
    .input('breed_id', sql.Int, breed_id)
    .input('name', sql.NVarChar, name)
    .input('date_of_birth', sql.Date, date_of_birth || null)
    .input('care_level', sql.NVarChar, care_level)
    .input('current_health_status', sql.NVarChar, current_health_status)
    .input('dietary_restriction', sql.NVarChar, dietary_restriction)
    .input('gender', sql.NVarChar, gender)
    .query(`UPDATE cat SET
              breed_id = @breed_id,
              name = @name,
              date_of_birth = @date_of_birth,
              care_level = @care_level,
              current_health_status = @current_health_status,
              dietary_restriction = @dietary_restriction,
              gender = @gender
            WHERE cat_id = @id`);

  const io = req.app.get('io');
  if (io) io.emit('cats_updated');

  res.json({ success: true });
});

router.get('/breeds', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT * FROM breed');
  res.json(result.recordset);
});

// Thêm giống mèo mới (manager tự thêm giống, không cần sửa SQL tay)
router.post('/breeds', async (req, res) => {
  const { name, country_of_origin, temperament_description } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Tên giống mèo không được để trống' });

  const pool = await poolPromise;
  const result = await pool.request()
    .input('name', sql.NVarChar, name)
    .input('country_of_origin', sql.NVarChar, country_of_origin || null)
    .input('temperament_description', sql.NVarChar, temperament_description || null)
    .query(`INSERT INTO breed (name, country_of_origin, temperament_description)
            OUTPUT INSERTED.breed_id
            VALUES (@name, @country_of_origin, @temperament_description)`);

  const io = req.app.get('io');
  if (io) io.emit('cats_updated');

  res.json({ breed_id: result.recordset[0].breed_id });
});

// Reservations — kèm tên mèo được đặt (nếu có)
router.get('/reservations', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT r.*, c.name AS customer_name, c.phone_number, cat.name AS cat_name
    FROM reservation r
    JOIN customer c ON r.customer_id = c.customer_id
    LEFT JOIN cat ON r.cat_id = cat.cat_id
    ORDER BY r.reservation_date_time DESC
  `);
  res.json(result.recordset);
});

router.put('/reservations/:id/confirm', async (req, res) => {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, req.params.id)
    .query("UPDATE reservation SET status = 'confirmed' WHERE reservation_id = @id");

  const io = req.app.get('io');
  if (io) io.emit('reservation_updated', { reservation_id: req.params.id, status: 'confirmed' });

  res.json({ success: true });
});

module.exports = router;
