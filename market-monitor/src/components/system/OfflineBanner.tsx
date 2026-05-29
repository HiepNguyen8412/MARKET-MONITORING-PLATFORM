import { WifiOff } from 'lucide-react'
import { useMarketDataContext } from '../../context/marketDataContext'

export function OfflineBanner() {
  const { offline } = useMarketDataContext()

  if (!offline) return null

  return (
    <div className="sticky top-0 z-30 flex items-center justify-center gap-2 border-b border-[color:rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] px-4 py-2 text-sm text-[var(--text-primary)]">
      <WifiOff className="h-4 w-4 text-[var(--red)]" aria-hidden />
      Bạn đang ngoại tuyến. Dữ liệu có thể không cập nhật.
    </div>
  )
}
