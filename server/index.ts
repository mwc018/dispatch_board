import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';

import webhooksRouter from './routes/webhooks';
import techniciansRouter from './routes/technicians';
import serviceOrdersRouter from './routes/serviceOrders';
import dispatchRouter from './routes/dispatch';

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: [CLIENT_URL, /zoho\.com$/], methods: ['GET', 'POST'], credentials: true },
});

app.set('io', io);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: [CLIENT_URL, /zoho\.com$/], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/webhooks', webhooksRouter);
app.use('/api/technicians', techniciansRouter);
app.use('/api/service-orders', serviceOrdersRouter);
app.use('/api/dispatch', dispatchRouter);
app.use('/api', dispatchRouter);

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', time: new Date().toISOString() }));

if (process.env.NODE_ENV === 'production') {
  import('path').then((path) => {
    const clientDist = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(clientDist));
    app.get('*', (req: Request, res: Response) => {
      if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
        res.sendFile(path.join(clientDist, 'index.html'));
      }
    });
  });
}

io.on('connection', (socket) => {
  const { date } = socket.handshake.query;
  const room = `board_${date || 'today'}`;
  socket.join(room);
  console.log(`[Socket] Client connected: ${socket.id}, room: ${room}`);
  socket.on('disconnect', () => console.log(`[Socket] Client disconnected: ${socket.id}`));
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Dispatch server running on http://localhost:${PORT}`));
