// customer-server.js - Website #1: for customers (notifies manager via Socket.io)
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const customerRoutes = require('./routes/customerRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'customer-public')));

// Gắn io vào app để routes có thể emit event
app.set('io', io);

app.use('/api', customerRoutes);

io.on('connection', (socket) => {
  console.log('Customer connected:', socket.id);
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Customer site running at http://localhost:${PORT}`));
