import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useMarketStore } from '../store/useMarketStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Constants for rate limiting
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 60000;

export const useMarketData = () => {
  const setCoins = useMarketStore((state) => state.setCoins);
  const setGlobalData = useMarketStore((state) => state.setGlobalData);
  const setHistory = useMarketStore((state) => state.setHistory);
  const checkAlerts = useMarketStore((state) => state.checkAlerts);
  const setIsLoading = useMarketStore((state) => state.setIsLoading);
  const setError = useMarketStore((state) => state.setError);
  
  const refreshInterval = useRef<any>(null);
  const rateLimitBackoffRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);

  const fetchCoinHistory = useCallback(async (coinId: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/crypto/coins/${coinId}/market_chart`, {
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
  }, []);

  const fetchData = useCallback(async () => {
    // ✅ CRITICAL FIX: If we're rate limited, don't retry immediately
    if (rateLimitBackoffRef.current > 0) {
      console.warn(`⏸️ Rate limited. Skipping request. Retry after ${rateLimitBackoffRef.current}ms`);
      setError(true, 429);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch Markets
      const marketsRes = await axios.get(`${API_URL}/api/crypto/markets`, {
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
      const globalRes = await axios.get(`${API_URL}/api/crypto/global`);
      setGlobalData(globalRes.data.data);

      // 3. Fetch default history (Bitcoin)
      const btcHistory = await fetchCoinHistory('bitcoin');
      setHistory(btcHistory);

      // 4. Check Alerts
      checkAlerts();
      
      // ✅ Reset counters on success
      setError(false, null);
      retryCountRef.current = 0;
      rateLimitBackoffRef.current = 0;
    } catch (error: any) {
      console.error('Error fetching market data:', error);
      
      // ✅ CRITICAL FIX: Handle 429 with exponential backoff
      if (error.response?.status === 429) {
        console.warn('⚠️ 429 Too Many Requests - Implementing exponential backoff');
        
        retryCountRef.current++;
        if (retryCountRef.current > MAX_RETRIES) {
          console.error('❌ Max retries exceeded for 429. Stopping requests.');
          setError(true, 429);
          // Stop the refresh interval to prevent continuous hammering
          if (refreshInterval.current) clearInterval(refreshInterval.current);
          return;
        }
        
        // Calculate exponential backoff: 1s, 2s, 4s...
        const backoffMs = Math.min(
          INITIAL_BACKOFF_MS * Math.pow(2, retryCountRef.current - 1),
          MAX_BACKOFF_MS
        );
        
        rateLimitBackoffRef.current = backoffMs;
        console.log(`⏳ Waiting ${backoffMs}ms before next retry (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
        
        // Set backoff timer
        setTimeout(() => {
          rateLimitBackoffRef.current = 0;
        }, backoffMs);
        
        setError(true, 429);
      } else {
        // For non-429 errors, reset retry count
        retryCountRef.current = 0;
        setError(true, error.response?.status || 500);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setCoins, setGlobalData, setHistory, checkAlerts, setIsLoading, setError, fetchCoinHistory]);

  // ✅ CRITICAL FIX: Use empty dependency array - fetchData is already stable via useCallback
  useEffect(() => {
    fetchData();
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    // Only set up interval after initial fetch
    refreshInterval.current = setInterval(fetchData, 60000);
    
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [fetchData]); // Now safe to include since fetchData is wrapped in useCallback

  return { refresh: fetchData, fetchCoinHistory };
};
