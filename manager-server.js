// manager-server.js - Website #2: for manager / staff (with Socket.io)
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const managerRoutes = require('./routes/managerRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'manager-public')));

// Gắn io vào app để dùng trong routes
app.set('io', io);

app.use('/api', managerRoutes);

io.on('connection', (socket) => {
  console.log('Manager dashboard connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Manager dashboard disconnected:', socket.id);
  });
});

const PORT = 4000;
server.listen(PORT, () => console.log(`Manager site running at http://localhost:${PORT}`));
