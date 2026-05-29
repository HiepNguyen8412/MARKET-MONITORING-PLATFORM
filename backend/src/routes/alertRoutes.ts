import { Router } from 'express';
import { prisma } from '../index';
import { authenticateJWT, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateJWT);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const alerts = await prisma.alertThreshold.findMany({
      where: { userId: req.user?.id },
      include: { asset: true }
    });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { assetId, targetPrice, type } = req.body;
    const alert = await prisma.alertThreshold.create({
      data: {
        userId: req.user?.id as number,
        assetId: parseInt(assetId),
        targetPrice: parseFloat(targetPrice),
        type
      },
      include: { asset: true }
    });
    res.json(alert);
  } catch (error) {
    res.status(400).json({ error: 'Could not create alert' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const alertId = parseInt(req.params.id);
    const alert = await prisma.alertThreshold.findUnique({
      where: { id: alertId }
    });
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    if (alert.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this alert' });
    }

    await prisma.alertThreshold.delete({
      where: { id: alertId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Could not delete alert' });
  }
});

export default router;
