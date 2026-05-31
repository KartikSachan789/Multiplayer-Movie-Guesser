require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const gameHandler = require('./socket/gameHandler');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || '*';

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Hollywood/Bollywood Game Server — In-Memory Mode' });
});

// Socket.io game handler
io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);
  gameHandler(io, socket);
  socket.on('disconnect', () => console.log(`🔌 Disconnected: ${socket.id}`));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (in-memory, no MongoDB)`);
});
