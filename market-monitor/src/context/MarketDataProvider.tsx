import { type ReactNode, useEffect, useRef } from 'react'
import { useMarketData } from '../hooks/useMarketData'
import { useUiStore } from '../stores/uiStore'
import { MarketDataContext } from './marketDataContext'

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const val = useMarketData()
  const lastShown = useRef<string | null>(null)

  useEffect(() => {
    if (!val.error || val.error === 'offline') {
      lastShown.current = null
      return
    }
    if (val.isStale && val.error !== lastShown.current) {
      lastShown.current = val.error
      useUiStore
        .getState()
        .showToast(
          `Lỗi API (${val.error}). Đang hiển thị dữ liệu đã cache.`,
        )
    }
  }, [val.error, val.isStale])

  return (
    <MarketDataContext.Provider value={val}>{children}</MarketDataContext.Provider>
  )
}
