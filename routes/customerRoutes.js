// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// Get full menu
router.get('/menu', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT * FROM menu ORDER BY category, name');
  res.json(result.recordset);
});

// Get all cats with breed info
router.get('/cats', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT cat.*, breed.name AS breed_name, breed.temperament_description
    FROM cat JOIN breed ON cat.breed_id = breed.breed_id
  `);
  res.json(result.recordset);
});

// Create a new customer
router.post('/customer', async (req, res) => {
  const { name, phone_number, email } = req.body;
  const pool = await poolPromise;
  const result = await pool.request()
    .input('name', sql.VarChar, name)
    .input('phone_number', sql.VarChar, phone_number)
    .input('email', sql.VarChar, email)
    .query(`INSERT INTO customer (name, phone_number, email)
            OUTPUT INSERTED.customer_id
            VALUES (@name, @phone_number, @email)`);
  res.json({ customer_id: result.recordset[0].customer_id });
});

// Create a reservation
router.post('/reservation', async (req, res) => {
  const { customer_id, table_number, reservation_date_time, number_of_guests } = req.body;
  const pool = await poolPromise;
  const result = await pool.request()
    .input('customer_id', sql.Int, customer_id)
    .input('table_number', sql.Int, table_number)
    .input('reservation_date_time', sql.DateTime, new Date(reservation_date_time))
    .input('number_of_guests', sql.Int, number_of_guests)
    .query(`INSERT INTO reservation (customer_id, table_number, reservation_date_time, number_of_guests)
            OUTPUT INSERTED.reservation_id
            VALUES (@customer_id, @table_number, @reservation_date_time, @number_of_guests)`);

  const reservation_id = result.recordset[0].reservation_id;

  // 🔔 Thông báo real-time cho manager dashboard
  const io = req.app.get('io');
  if (io) {
    io.emit('new_reservation', {
      reservation_id,
      customer_id,
      table_number,
      number_of_guests,
      reservation_date_time
    });
  }

  res.json({ reservation_id });
});

// Place an order
router.post('/order', async (req, res) => {
  const { customer_id, items } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: 'No items provided' });

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    const orderRequest = new sql.Request(transaction);
    const orderResult = await orderRequest
      .input('customer_id', sql.Int, customer_id)
      .query(`INSERT INTO [order] (customer_id, total_amount)
              OUTPUT INSERTED.order_id
              VALUES (@customer_id, 0)`);
    const orderId = orderResult.recordset[0].order_id;
    let total = 0;

    for (const item of items) {
      const priceReq = new sql.Request(transaction);
      const priceResult = await priceReq
        .input('item_id', sql.Int, item.item_id)
        .query('SELECT base_price FROM menu WHERE item_id = @item_id');
      const basePrice = priceResult.recordset[0].base_price;
      const subtotal = basePrice * item.quantity;
      total += subtotal;

      const itemReq = new sql.Request(transaction);
      await itemReq
        .input('order_id', sql.Int, orderId)
        .input('item_id', sql.Int, item.item_id)
        .input('quantity', sql.Int, item.quantity)
        .input('subtotal', sql.Decimal(10, 2), subtotal)
        .query(`INSERT INTO order_item (order_id, item_id, quantity, subtotal)
                VALUES (@order_id, @item_id, @quantity, @subtotal)`);

      // Trừ stock
      const stockReq = new sql.Request(transaction);
      await stockReq
        .input('item_id', sql.Int, item.item_id)
        .input('quantity', sql.Int, item.quantity)
        .query(`UPDATE menu SET stock_quantity = stock_quantity - @quantity
                WHERE item_id = @item_id`);
    }

    await transaction.commit();

    // 🔔 Thông báo real-time cho manager dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', {
        order_id: orderId,
        customer_id,
        total_amount: total,
        status: 'pending'
      });
    }

    res.json({ order_id: orderId, total_amount: total });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
