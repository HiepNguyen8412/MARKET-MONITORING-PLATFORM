import { createContext, useContext } from 'react'
import type { UseMarketDataResult } from '../hooks/useMarketData'

export const MarketDataContext = createContext<UseMarketDataResult | null>(null)

export function useMarketDataContext(): UseMarketDataResult {
  const ctx = useContext(MarketDataContext)
  if (!ctx) {
    throw new Error('useMarketDataContext must be inside MarketDataProvider')
  }
  return ctx
}
