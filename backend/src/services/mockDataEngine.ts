import { prisma, io } from '../index';

export function startMockDataEngine() {
  setInterval(async () => {
    try {
      const assets = await prisma.asset.findMany();
      
      for (const asset of assets) {
        const changePercent = (Math.random() * 0.04) - 0.02; // -2% to +2%
        const newPrice = asset.currentPrice * (1 + changePercent);
        
        const updatedAsset = await prisma.asset.update({
          where: { id: asset.id },
          data: {
            currentPrice: newPrice,
            lastUpdated: new Date()
          }
        });

        const marketData = await prisma.marketData.create({
          data: {
            assetId: asset.id,
            price: newPrice,
            volume: Math.random() * 1000
          }
        });

        io.emit('price_update', {
          symbol: updatedAsset.symbol,
          price: newPrice,
          timestamp: marketData.timestamp
        });
        
        checkAlerts(updatedAsset.id, newPrice);
      }
    } catch (error) {
      console.error('Error in Mock Data Engine:', error);
    }
  }, 5000); // Every 5 seconds
}

async function checkAlerts(assetId: number, currentPrice: number) {
  const activeAlerts = await prisma.alertThreshold.findMany({
    where: { assetId, status: 'ACTIVE' }
  });

  for (const alert of activeAlerts) {
    if (alert.type === 'ABOVE' && currentPrice > alert.targetPrice) {
      await triggerAlert(alert.id);
    } else if (alert.type === 'BELOW' && currentPrice < alert.targetPrice) {
      await triggerAlert(alert.id);
    }
  }
}

async function triggerAlert(alertId: number) {
  const alert = await prisma.alertThreshold.update({
    where: { id: alertId },
    data: { status: 'TRIGGERED' },
    include: { asset: true }
  });
  
  io.emit('alert_triggered', {
    userId: alert.userId,
    message: `Alert triggered: ${alert.asset.symbol} crossed your target price of ${alert.targetPrice}`
  });
}
