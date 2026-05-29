import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { io, Socket } from 'socket.io-client';

export interface AlertItem {
  id: number;
  assetId: number;
  targetPrice: number;
  type: 'ABOVE' | 'BELOW';
  status: 'ACTIVE' | 'TRIGGERED';
  asset: {
    id: number;
    symbol: string;
    name: string;
    currentPrice: number;
  };
}

interface AlertState {
  items: AlertItem[];
  isLoading: boolean;
  error: string | null;
  socket: Socket | null;
  fetchAlerts: () => Promise<void>;
  addAlert: (assetId: number, targetPrice: number, type: 'ABOVE' | 'BELOW') => Promise<void>;
  removeAlert: (id: number) => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

const API_URL = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useAlertStore = create<AlertState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  socket: null,

  fetchAlerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/alerts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      set({ items: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addAlert: async (assetId: number, targetPrice: number, type: 'ABOVE' | 'BELOW') => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assetId, targetPrice, type })
      });
      if (!response.ok) throw new Error('Failed to add alert');
      
      const newItem = await response.json();
      set((state) => ({ items: [...state.items, newItem] }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  removeAlert: async (id: number) => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/alerts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to remove alert');
      
      set((state) => ({ items: state.items.filter(item => item.id !== id) }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  connectSocket: () => {
    const { token } = useAuthStore.getState();
    const currentSocket = get().socket;
    
    if (currentSocket) return;

    const newSocket = io(API_URL, {
      auth: { token: `Bearer ${token}` }
    });

    newSocket.on('alert_triggered', (data: { userId: number, message: string }) => {
      // Notification sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}
      
      // Update the local state to change status to TRIGGERED
      get().fetchAlerts();

      // Dispatch a custom event so UI can show a toast
      window.dispatchEvent(new CustomEvent('alert-notification', { detail: data.message }));
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  }
}));
