import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import cryptoRoutes from './routes/cryptoRoutes';
import assetRoutes from './routes/assetRoutes';
import watchlistRoutes from './routes/watchlistRoutes';
import alertRoutes from './routes/alertRoutes';
import portfolioRoutes from './routes/portfolioRoutes';
import { startMockDataEngine } from './services/mockDataEngine';
import { startScraperService } from './services/scraperService';

dotenv.config();

export const app = express();
let httpServer: ReturnType<typeof createServer> | null = null;
export let io: Server | null = null;

export const prisma = new PrismaClient();
// Mock redis client to bypass Redis requirement for standalone run
export const redisClient = {
  connect: async () => {},
  on: (event: string, cb: any) => {},
  get: async (key: string) => null,
  setEx: async (key: string, seconds: number, value: string) => {}
} as any;

const FRONTEND_URL = process.env.FRONTEND_URL;
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:4000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = FRONTEND_URL ? [FRONTEND_URL] : defaultOrigins;
      if (allowed.includes(origin) || allowed.includes('*')) return callback(null, true);
      return callback(new Error('CORS not allowed'), false);
    },
    credentials: true,
  })
);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/watchlists', watchlistRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/crypto', cryptoRoutes);

const PORT = process.env.PORT || 4000;

function setupSocketServer() {
  httpServer = createServer(app);
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

async function startServer() {
  await redisClient.connect();
  
  // Ensure default user exists for public access
  try {
    await prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        email: 'public@flow.com',
        password_hash: 'nopassword',
        role: 'USER'
      }
    });
    console.log('Default public user ensured');
  } catch (err) {
    console.error('Error creating default user:', err);
  }

  setupSocketServer();

  httpServer?.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    startMockDataEngine();
    startScraperService();
  });
}

if (!process.env.VERCEL) {
  startServer().catch(console.error);
}
