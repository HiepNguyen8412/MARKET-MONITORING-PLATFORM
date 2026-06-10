import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password_hash = await bcrypt.hash('password123', 10);
  
  const adminEmail = 'admin@example.com';
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password_hash,
      role: 'ADMIN',
      portfolio: {
        create: {
          balance: 9999999999.0, // 10 Billion
        }
      }
    },
  });

  const assets = [
    { symbol: 'BTC', name: 'Bitcoin', currentPrice: 65000 },
    { symbol: 'ETH', name: 'Ethereum', currentPrice: 3500 },
    { symbol: 'SOL', name: 'Solana', currentPrice: 150 },
    { symbol: 'AAPL', name: 'Apple Inc.', currentPrice: 175 },
    { symbol: 'TSLA', name: 'Tesla Inc.', currentPrice: 200 },
  ];

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { symbol: asset.symbol },
      update: {},
      create: asset,
    });
  }

  console.log('Database seeded with demo user and assets.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
