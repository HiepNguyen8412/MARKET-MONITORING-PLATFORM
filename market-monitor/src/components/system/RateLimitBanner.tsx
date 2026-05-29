import { useMarketDataContext } from '../../context/marketDataContext'

export function RateLimitBanner() {
  const { rateLimitCountdown } = useMarketDataContext()

  if (rateLimitCountdown === null) return null

  return (
    <div className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[rgba(59,130,246,0.12)] px-4 py-2 text-center text-sm text-[var(--text-primary)]">
      Đang tải lại... (
      <span className="tabular-nums font-semibold text-[var(--accent-cyan)]">
        {rateLimitCountdown}s
      </span>
      )
    </div>
  )
}
