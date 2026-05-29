import { Router } from 'express';
import { prisma } from '../index';
import { authenticateJWT, AuthRequest } from '../middleware/authMiddleware';

interface PortfolioRequest extends AuthRequest {
  portfolioId?: number;
}

const router = Router();

router.use(authenticateJWT);

// Middleware to ensure portfolio exists for the authenticated user
const ensurePortfolio = async (req: PortfolioRequest, res: any, next: any) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  let portfolio = await prisma.portfolio.findUnique({
    where: { userId }
  });

  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: {
        userId,
        balance: 100000.0 // Starting balance
      }
    });
  }
  
  req.portfolioId = portfolio.id;
  next();
};

router.use(ensurePortfolio);

router.get('/', async (req: any, res) => {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: req.portfolioId },
      include: {
        holdings: {
          include: { asset: true }
        },
        transactions: {
          include: { asset: true },
          orderBy: { timestamp: 'desc' },
          take: 50
        }
      }
    });
    res.json(portfolio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/trade', async (req: any, res) => {
  try {
    const { symbol, amount, price, type } = req.body;
    
    if (!symbol || !amount || !price || !['BUY', 'SELL'].includes(type)) {
      return res.status(400).json({ error: 'Invalid trade parameters' });
    }

    const asset = await prisma.asset.upsert({
      where: { symbol: symbol.toUpperCase() },
      update: { currentPrice: price },
      create: {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(),
        currentPrice: price
      }
    });

    const totalValue = amount * price;

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const portfolio = await tx.portfolio.findUnique({
        where: { id: req.portfolioId }
      });

      if (!portfolio) throw new Error('Portfolio not found');

      let holding = await tx.holding.findUnique({
        where: {
          portfolioId_assetId: {
            portfolioId: req.portfolioId,
            assetId: asset.id
          }
        }
      });

      if (type === 'BUY') {
        if (portfolio.balance < totalValue) {
          throw new Error('Insufficient balance');
        }

        // Update balance
        await tx.portfolio.update({
          where: { id: req.portfolioId },
          data: { balance: portfolio.balance - totalValue }
        });

        // Update or create holding
        if (holding) {
          const newAmount = holding.amount + amount;
          const newAvgPrice = ((holding.amount * holding.avgPrice) + totalValue) / newAmount;
          await tx.holding.update({
            where: { id: holding.id },
            data: { amount: newAmount, avgPrice: newAvgPrice }
          });
        } else {
          await tx.holding.create({
            data: {
              portfolioId: req.portfolioId,
              assetId: asset.id,
              amount: amount,
              avgPrice: price
            }
          });
        }
      } else if (type === 'SELL') {
        if (!holding || holding.amount < amount) {
          throw new Error('Insufficient asset amount');
        }

        // Update balance
        await tx.portfolio.update({
          where: { id: req.portfolioId },
          data: { balance: portfolio.balance + totalValue }
        });

        // Update holding
        const newAmount = holding.amount - amount;
        if (newAmount === 0) {
          await tx.holding.delete({ where: { id: holding.id } });
        } else {
          await tx.holding.update({
            where: { id: holding.id },
            data: { amount: newAmount }
          });
        }
      }

      // Record transaction
      await tx.transaction.create({
        data: {
          portfolioId: req.portfolioId,
          assetId: asset.id,
          type,
          amount,
          price
        }
      });

      return tx.portfolio.findUnique({
        where: { id: req.portfolioId },
        include: {
          holdings: { include: { asset: true } },
          transactions: { include: { asset: true }, orderBy: { timestamp: 'desc' }, take: 10 }
        }
      });
    });

    res.json(result);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Trade failed' });
  }
});

export default router;
