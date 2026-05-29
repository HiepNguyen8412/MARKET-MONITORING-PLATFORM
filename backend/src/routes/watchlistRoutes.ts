import { Router } from 'express';
import { prisma } from '../index';
import { authenticateJWT, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateJWT);

router.get('/', async (req, res) => {
  try {
    const watchlists = await prisma.watchlist.findMany({
      where: { userId: (req as any).user.id },
      include: { asset: true }
    });
    res.json(watchlists);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { assetId } = req.body;
    const watchlist = await prisma.watchlist.create({
      data: {
        userId: (req as any).user.id,
        assetId
      },
      include: { asset: true }
    });
    res.json(watchlist);
  } catch (error) {
    res.status(400).json({ error: 'Could not add to watchlist' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const watchlistId = parseInt(req.params.id);
    
    // Ensure the watchlist belongs to the user
    const watchlistItem = await prisma.watchlist.findUnique({
      where: { id: watchlistId }
    });
    
    if (!watchlistItem) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }
    
    if (watchlistItem.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this item' });
    }

    await prisma.watchlist.delete({
      where: { id: watchlistId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Could not delete from watchlist' });
  }
});

export default router;
