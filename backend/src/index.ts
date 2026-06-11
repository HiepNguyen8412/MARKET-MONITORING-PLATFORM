import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { exec } from 'child_process';
import { promisify } from 'util';
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

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isLocalhost =
        origin.startsWith('http://localhost') ||
        origin.startsWith('https://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('https://127.0.0.1');

      if (origin.endsWith('.vercel.app') || isLocalhost) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

const execAsync = promisify(exec);
const PORT = process.env.PORT || 4000;

async function initDatabase() {
  try {
    console.log('Đang đồng bộ database...');
    await prisma.$executeRaw`SELECT 1`;
    await execAsync('npx prisma db push');
    console.log('Database đã sẵn sàng!');
  } catch (error) {
    console.error('Lỗi đồng bộ database:', error);
    throw error;
  }
}

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

  await initDatabase();
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
