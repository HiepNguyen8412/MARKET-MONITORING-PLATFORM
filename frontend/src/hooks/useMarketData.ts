import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useMarketStore } from '../store/useMarketStore';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export const useMarketData = () => {
  const { setCoins, setGlobalData, setHistory, checkAlerts, setIsLoading, setError } = useMarketStore();
  const refreshInterval = useRef<any>(null);

  const fetchCoinHistory = async (coinId: string) => {
    try {
      const res = await axios.get(`${COINGECKO_BASE}/coins/${coinId}/market_chart`, {
        params: { vs_currency: 'usd', days: 1, interval: 'hourly' }
      });
      const formatted = (res.data?.prices || []).map(([ts, price]: [number, number]) => ({
        time: ts,
        price: price
      }));
      return formatted;
    } catch (error) {
      console.error(`Error fetching ${coinId} history:`, error);
      return [];
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Markets
      const marketsRes = await axios.get(`${COINGECKO_BASE}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 20,
          page: 1,
          sparkline: true,
        }
      });
      setCoins(marketsRes.data);

      // 2. Fetch Global Data
      const globalRes = await axios.get(`${COINGECKO_BASE}/global`);
      setGlobalData(globalRes.data.data);

      // 3. Fetch default history (Bitcoin)
      const btcHistory = await fetchCoinHistory('bitcoin');
      setHistory(btcHistory);

      // 4. Check Alerts
      checkAlerts();
      setError(false, null);
    } catch (error: any) {
      console.error('Error fetching market data:', error);
      if (error.response?.status === 429) {
        setError(true, 429);
      } else {
        setError(true, error.response?.status || 500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    refreshInterval.current = setInterval(fetchData, 60000);
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, []);

  return { refresh: fetchData, fetchCoinHistory };
};
