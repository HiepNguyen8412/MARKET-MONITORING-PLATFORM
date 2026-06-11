import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

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

      if (origin.includes('vercel.app') || origin.includes('localhost')) {
        return callback(null, true);
      }

      return callback(new Error('CORS not allowed by server'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

app.use('/api/auth', authRoutes);

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

function forceResetDatabase() {
  try {
    console.log('Đang ép buộc đồng bộ database...');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    execSync('node dist/seed.js', { stdio: 'inherit' });
    console.log('Đồng bộ database thành công!');
  } catch (error) {
    console.error('Lỗi đồng bộ DB:', error);
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
      where: { email: 'public@flow.com' },
      update: {},
      create: {
        email: 'public@flow.com',
        password_hash: 'nopassword',
        role: 'USER'
      }
    });
    console.log('Default public user ensured');
  } catch (err) {
    console.error('Error creating default user:', err);
  }

  forceResetDatabase();
  await initDatabase();
  setupSocketServer();

  httpServer?.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    // Disabled all background engines to keep backend focused on Auth only.
  });
}

if (!process.env.VERCEL) {
  startServer().catch(console.error);
}
