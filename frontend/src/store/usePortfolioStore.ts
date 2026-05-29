import { create } from 'zustand';

interface Holding {
  id: number;
  assetId: number;
  amount: number;
  avgPrice: number;
  asset: {
    symbol: string;
    name: string;
    currentPrice: number;
  };
}

interface Transaction {
  id: number;
  assetId: number;
  type: string;
  amount: number;
  price: number;
  timestamp: string;
  asset: {
    symbol: string;
    name: string;
  };
}

interface PortfolioState {
  balance: number;
  holdings: Holding[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;

  fetchPortfolio: () => Promise<void>;
  trade: (symbol: string, amount: number, price: number, type: 'BUY' | 'SELL') => Promise<void>;
}

const API_URL = 'http://localhost:4000/api/portfolio';

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  balance: 0,
  holdings: [],
  transactions: [],
  isLoading: false,
  error: null,

  fetchPortfolio: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      const data = await res.json();
      set({ 
        balance: data.balance, 
        holdings: data.holdings, 
        transactions: data.transactions,
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  trade: async (symbol, amount, price, type) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, amount, price, type })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Trade failed');
      
      // Update state with new portfolio data
      set({ 
        balance: data.balance, 
        holdings: data.holdings, 
        transactions: data.transactions,
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  }
}));
