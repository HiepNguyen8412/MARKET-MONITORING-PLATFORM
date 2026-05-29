import { useState, useEffect } from 'react';

export interface Asset {
  id: string;
  label: string;
  category: 'crypto' | 'commodity' | 'forex' | 'stock';
  color: string;
  icon?: string;
}

export interface ChartPoint {
  time: number;
  price: number;
  label?: string;
}

export interface AssetData {
  chartPoints: ChartPoint[];
  price: number;
  change24h: number;
  currency: string;
  source: 'live' | 'cached' | 'simulated';
  error?: string;
}

export const CRYPTO_ASSETS: Asset[] = [
  { id: 'bitcoin',      label: 'BTC',   category: 'crypto', color: '#f7931a' },
  { id: 'ethereum',     label: 'ETH',   category: 'crypto', color: '#627eea' },
  { id: 'binancecoin',  label: 'BNB',   category: 'crypto', color: '#f3ba2f' },
  { id: 'solana',       label: 'SOL',   category: 'crypto', color: '#9945ff' },
  { id: 'ripple',       label: 'XRP',   category: 'crypto', color: '#346aa9' },
  { id: 'cardano',      label: 'ADA',   category: 'crypto', color: '#0033ad' },
  { id: 'dogecoin',     label: 'DOGE',  category: 'crypto', color: '#c2a633' },
  { id: 'toncoin',      label: 'TON',   category: 'crypto', color: '#0088cc' },
];

export const TRADITIONAL_ASSETS: Asset[] = [
  { id: 'GC=F',  label: 'Vàng',    category: 'commodity', color: '#ffd700', icon: '🥇' },
  { id: 'SI=F',  label: 'Bạc',     category: 'commodity', color: '#c0c0c0', icon: '🥈' },
  { id: 'CL=F',  label: 'Dầu WTI', category: 'commodity', color: '#8b4513', icon: '🛢️' },
  { id: 'NG=F',  label: 'Khí đốt', category: 'commodity', color: '#ff6b35', icon: '⚡' },
  { id: 'EURUSD=X', label: 'EUR/USD', category: 'forex', color: '#003399', icon: '💶' },
  { id: 'USDJPY=X', label: 'USD/JPY', category: 'forex', color: '#bc002d', icon: '💴' },
  { id: 'GBPUSD=X', label: 'GBP/USD', category: 'forex', color: '#012169', icon: '💷' },
  { id: 'USDVND=X', label: 'USD/VND', category: 'forex', color: '#da251d', icon: '🇻🇳' },
  { id: '^GSPC',  label: 'S&P 500',  category: 'stock', color: '#1f77b4', icon: '📈' },
  { id: '^DJI',   label: 'Dow Jones',category: 'stock', color: '#2ca02c', icon: '🏛️' },
  { id: '^IXIC',  label: 'NASDAQ',   category: 'stock', color: '#9467bd', icon: '💻' },
  { id: 'NVDA',   label: 'NVIDIA',   category: 'stock', color: '#76b900', icon: '🎮' },
  { id: 'AAPL',   label: 'Apple',    category: 'stock', color: '#555555', icon: '🍎' },
  { id: 'TSLA',   label: 'Tesla',    category: 'stock', color: '#cc0000', icon: '🚗' },
];

export const CATEGORIES = [
  { id: 'all',       label: 'Tất cả',    icon: '🌐' },
  { id: 'crypto',    label: 'Crypto',    icon: '₿'  },
  { id: 'commodity', label: 'Hàng hóa',  icon: '🥇' },
  { id: 'forex',     label: 'Ngoại hối', icon: '💱' },
  { id: 'stock',     label: 'Cổ phiếu',  icon: '📊' },
];

export const ALL_ASSETS = [...CRYPTO_ASSETS, ...TRADITIONAL_ASSETS];

const dataCache = new Map<string, { data: AssetData; fetchedAt: number }>();
const CACHE_TTL = 60000;

async function fetchCryptoChart(coinId: string): Promise<ChartPoint[]> {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1&interval=hourly`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const json = await res.json();
  return json.prices.map(([ts, price]: [number, number]) => ({
    time: ts,
    price,
  }));
}

async function fetchCryptoQuote(coinId: string) {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}`;
  const res = await fetch(url);
  const [coin] = await res.json();
  return {
    price: coin.current_price,
    change24h: coin.price_change_percentage_24h,
    currency: 'USD',
  };
}

async function fetchYahooChart(symbol: string): Promise<ChartPoint[]> {
  const url = `http://localhost:3001/api/assets/proxy/yahoo/${encodeURIComponent(symbol)}?interval=1h&range=1d`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Backend Proxy Error ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('No chart result for ' + symbol);
  const timestamps: number[] = result.timestamp ?? [];
  const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
  return timestamps
    .map((ts, i) => ({
      time: ts * 1000,
      price: closes[i],
    }))
    .filter(d => d.price != null && !isNaN(d.price));
}

async function fetchYahooQuote(symbol: string) {
  const url = `http://localhost:3001/api/assets/proxy/yahoo/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Backend Proxy Error ${res.status}`);
  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error('No meta for ' + symbol);
  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose ?? meta.previousClose;
  const change24h = prev ? ((price - prev) / prev) * 100 : 0;
  return { price, change24h, currency: meta.currency ?? 'USD' };
}

function generateSimulatedChart(basePrice: number, volatility: number): ChartPoint[] {
  const now = Date.now();
  const points: ChartPoint[] = [];
  let price = basePrice * 0.998;
  for (let i = 23; i >= 0; i--) {
    const ts = now - i * 3600000;
    price = price * (1 + (Math.random() - 0.48) * volatility);
    points.push({
      time: ts,
      price: parseFloat(price.toFixed(4)),
    });
  }
  return points;
}

export const useAssetData = (asset: Asset | undefined) => {
  const [assetData, setAssetData] = useState<AssetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!asset) return;

    let cancelled = false;
    const load = async () => {
      const cached = dataCache.get(asset.id);
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
        setAssetData({ ...cached.data, source: 'cached' });
        return;
      }

      setLoading(true);
      setError(null);
      try {
        let chartPoints: ChartPoint[];
        let quote: any;

        if (asset.category === 'crypto') {
          [chartPoints, quote] = await Promise.all([
            fetchCryptoChart(asset.id),
            fetchCryptoQuote(asset.id),
          ]);
        } else {
          [chartPoints, quote] = await Promise.all([
            fetchYahooChart(asset.id),
            fetchYahooQuote(asset.id),
          ]);
        }

        const data: AssetData = {
          chartPoints,
          price: quote.price,
          change24h: quote.change24h,
          currency: quote.currency,
          source: 'live',
        };

        if (!cancelled) {
          setAssetData(data);
          dataCache.set(asset.id, { data, fetchedAt: Date.now() });
        }
      } catch (e: any) {
        console.error(`Failed to load ${asset.id}:`, e);
        
        if (!cancelled) {
          try {
            // General Fallback for ALL assets to ensure UI is always lively
            const basePrices: Record<string, number> = {
              bitcoin: 67450, ethereum: 3520, binancecoin: 605, solana: 154, ripple: 0.6, cardano: 0.45, dogecoin: 0.16, toncoin: 6.5,
              'GC=F': 2345.5, 'SI=F': 28.3, 'CL=F': 82.5, 'NG=F': 2.1, 
              'EURUSD=X': 1.085, 'USDJPY=X': 155.6, 'GBPUSD=X': 1.25, 'USDVND=X': 25450,
              '^GSPC': 5234.18, '^DJI': 39069.23, '^IXIC': 16736.03, 'NVDA': 926.69, 'AAPL': 173.5, 'TSLA': 171.05
            };
            const fallbackPrice = basePrices[asset.id] || 100;
            const simulated = generateSimulatedChart(fallbackPrice, 0.004);
            const randomChange = (Math.random() - 0.4) * 5; // Random -2% to 3%
            
            const data: AssetData = {
              chartPoints: simulated,
              price: simulated[simulated.length - 1].price,
              change24h: randomChange,
              currency: asset.category === 'forex' && asset.id !== 'USDVND=X' ? asset.id.replace('=X', '').replace('USD', '') : 'USD',
              source: 'simulated',
            };
            setAssetData(data);
            // Clear error if we have fallback
            setError(null);
          } catch (fallbackErr) {
            setError('Data unavailable');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [asset?.id, asset?.category]);

  return { 
    data: assetData?.chartPoints || [], 
    quote: assetData ? { price: assetData.price, change24h: assetData.change24h, currency: assetData.currency } : null, 
    loading, 
    error,
    source: assetData?.source 
  };
};

export const formatPrice = (price: number, currency: string, category: string): string => {
  if (category === 'forex') {
    return price.toFixed(currency === 'JPY' ? 2 : 4);
  }
  if (category === 'commodity') {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (category === 'stock') {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }
  if (price > 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price > 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(6)}`;
};
