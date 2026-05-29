import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  role: string;
}

interface MarketState {
  user: User | null;
  token: string | null;
  assets: any[];
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAssets: (assets: any[]) => void;
  updateAssetPrice: (symbol: string, newPrice: number) => void;
}

export const useStore = create<MarketState>((set) => ({
  user: null,
  token: null,
  assets: [],
  setUser: (user) => set({ user }),
  setToken: (token) => {
    set({ token });
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  },
  setAssets: (assets) => set({ assets }),
  updateAssetPrice: (symbol, newPrice) => set((state) => ({
    assets: state.assets.map(a => a.symbol === symbol ? { ...a, currentPrice: newPrice, lastUpdated: new Date() } : a)
  }))
}));
