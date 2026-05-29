import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { io, Socket } from 'socket.io-client';

interface WatchlistItem {
  id: number;
  assetId: number;
  asset: {
    id: number;
    symbol: string;
    name: string;
    currentPrice: number;
  };
}

interface WatchlistState {
  items: WatchlistItem[];
  availableAssets: { id: number; symbol: string; name: string }[];
  isLoading: boolean;
  error: string | null;
  socket: Socket | null;
  connectSocket: () => void;
  disconnectSocket: () => void;
  fetchWatchlist: () => Promise<void>;
  fetchAvailableAssets: () => Promise<void>;
  addAsset: (assetId: number) => Promise<void>;
  removeAsset: (id: number) => Promise<void>;
}

const API_URL = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: [],
  availableAssets: [],
  isLoading: false,
  error: null,
  socket: null,

  connectSocket: () => {
    const { token } = useAuthStore.getState();
    const currentSocket = get().socket;
    
    if (currentSocket) return; // Already connected

    const newSocket = io(API_URL, {
      auth: { token: `Bearer ${token}` }
    });

    newSocket.on('price_update', (data: { symbol: string, price: number }) => {
      set((state) => {
        // Only update if the asset is in the watchlist
        const isTracking = state.items.some(item => item.asset.symbol === data.symbol);
        if (!isTracking) return state;

        return {
          items: state.items.map(item => 
            item.asset.symbol === data.symbol
              ? { ...item, asset: { ...item.asset, currentPrice: data.price } }
              : item
          )
        };
      });
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  fetchAvailableAssets: async () => {
    try {
      const response = await fetch(`${API_URL}/api/assets`);
      if (response.ok) {
        const data = await response.json();
        set({ availableAssets: data });
      }
    } catch (error) {
      console.error('Failed to fetch assets', error);
    }
  },

  fetchWatchlist: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/watchlists`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch watchlist');
      const data = await response.json();
      set({ items: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addAsset: async (assetId: number) => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/watchlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assetId })
      });
      if (!response.ok) throw new Error('Failed to add asset');
      
      const newItem = await response.json();
      set((state) => ({ items: [...state.items, newItem] }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  removeAsset: async (id: number) => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/watchlists/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to remove asset');
      
      set((state) => ({ items: state.items.filter(item => item.id !== id) }));
    } catch (error: any) {
      set({ error: error.message });
    }
  }
}));
