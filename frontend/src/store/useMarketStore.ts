import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  sparkline_in_7d: {
    price: number[];
  };
}

interface GlobalData {
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
  active_cryptocurrencies: number;
}

interface Alert {
  id: string;
  coinId: string;
  coinName: string;
  coinImage: string;
  condition: 'above' | 'below';
  targetPrice: number;
  currentPrice: number;
  status: 'active' | 'triggered';
}

interface MarketState {
  coins: Coin[];
  globalData: GlobalData | null;
  activeHistory: any[];
  watchlist: string[];
  alerts: Alert[];
  lastUpdated: number;
  isLoading: boolean;
  isError: boolean;
  errorStatus: number | null;
  
  setCoins: (coins: Coin[]) => void;
  setGlobalData: (data: GlobalData) => void;
  setHistory: (history: any[]) => void;
  toggleWatchlist: (coinId: string) => void;
  addAlert: (alert: Omit<Alert, 'id' | 'status'>) => void;
  removeAlert: (id: string) => void;
  checkAlerts: () => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (isError: boolean, status: number | null) => void;
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      coins: [],
      globalData: null,
      activeHistory: [],
      watchlist: [],
      alerts: [],
      lastUpdated: 0,
      isLoading: false,
      isError: false,
      errorStatus: null,

      setCoins: (coins) => set({ coins, lastUpdated: Date.now(), isError: false, errorStatus: null }),
      setGlobalData: (globalData) => set({ globalData }),
      setHistory: (activeHistory) => set({ activeHistory }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (isError, status) => set({ isError, errorStatus: status }),
      
      toggleWatchlist: (coinId) => set((state) => ({
        watchlist: state.watchlist.includes(coinId)
          ? state.watchlist.filter(id => id !== coinId)
          : [...state.watchlist, coinId]
      })),

      addAlert: (alert) => set((state) => ({
        alerts: [
          ...state.alerts,
          { ...alert, id: Math.random().toString(36).substr(2, 9), status: 'active' }
        ]
      })),

      removeAlert: (id) => set((state) => ({
        alerts: state.alerts.filter(a => a.id !== id)
      })),

      checkAlerts: () => {
        const { alerts, coins } = get();
        const updatedAlerts = alerts.map(alert => {
          if (alert.status === 'triggered') return alert;
          
          const coin = coins.find(c => c.id === alert.coinId);
          if (!coin) return alert;

          let triggered = false;
          if (alert.condition === 'above' && coin.current_price >= alert.targetPrice) triggered = true;
          if (alert.condition === 'below' && coin.current_price <= alert.targetPrice) triggered = true;

          if (triggered) {
            // Play sound notification
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch (e) {}

            // Browser notification could be triggered here
            if (Notification.permission === 'granted') {
              new Notification(`Cảnh báo giá: ${alert.coinName}`, {
                body: `${alert.coinName} đã chạm mốc $${alert.targetPrice}`,
                icon: alert.coinImage
              });
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification(`Cảnh báo giá: ${alert.coinName}`, {
                    body: `${alert.coinName} đã chạm mốc $${alert.targetPrice}`,
                    icon: alert.coinImage
                  });
                }
              });
            }
            
            return { ...alert, status: 'triggered' as const, currentPrice: coin.current_price };
          }
          return { ...alert, currentPrice: coin.current_price };
        });
        set({ alerts: updatedAlerts });
      }
    }),
    {
      name: 'market-monitor-storage',
      partialize: (state) => ({ watchlist: state.watchlist, alerts: state.alerts }),
    }
  )
);
