import { Router } from 'express';
import { prisma, redisClient } from '../index';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const cachedAssets = await redisClient.get('all_assets');
    if (cachedAssets) {
      return res.json(JSON.parse(cachedAssets));
    }

    const assets = await prisma.asset.findMany();
    await redisClient.setEx('all_assets', 10, JSON.stringify(assets)); // Cache for 10 seconds
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const asset = await prisma.asset.findUnique({
      where: { symbol: symbol.toUpperCase() }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const marketData = await prisma.marketData.findMany({
      where: { assetId: asset.id },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    res.json({ asset, marketData: marketData.reverse() });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/proxy/yahoo/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const interval = req.query.interval || '1h';
    const range = req.query.range || '1d';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `Yahoo API Error: ${response.status}` });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
