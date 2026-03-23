require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, /zoho\.com$/],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible from routes via app
app.set('io', io);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [CLIENT_URL, /zoho\.com$/],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/technicians', require('./routes/technicians'));
app.use('/api/service-orders', require('./routes/serviceOrders'));
app.use('/api/dispatch', require('./routes/dispatch'));
app.use('/api', require('./routes/dispatch')); // also mount /api/board here

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serve built React client in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}

// Socket.io — clients join and get the current board state
io.on('connection', (socket) => {
  const { date } = socket.handshake.query;
  const room = `board_${date || 'today'}`;
  socket.join(room);
  console.log(`[Socket] Client connected: ${socket.id}, room: ${room}`);

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Dispatch server running on http://localhost:${PORT}`);
});
