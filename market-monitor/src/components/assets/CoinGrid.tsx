import { Star } from 'lucide-react'
import type { CoinMarket } from '../../types'
import { formatCompactCapVol, formatUsd } from '../../utils/formatNumber'
import { RowSparkline } from '../charts/RowSparkline'
import { CoinLogo } from '../shared/CoinLogo'
import { PriceChange } from '../shared/PriceChange'

interface CoinGridProps {
  coins: CoinMarket[]
  wlSet: Set<string>
  onToggleWatchlist: (id: string) => void
  onOpen: (coin: CoinMarket) => void
  highlightId?: string | null
}

export function CoinGrid({
  coins,
  wlSet,
  onToggleWatchlist,
  onOpen,
  highlightId,
}: CoinGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {coins.map((c) => (
        <div
          key={c.id}
          id={`coin-row-${c.id}`}
          role="button"
          tabIndex={0}
          onClick={() => onOpen(c)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onOpen(c)
          }}
          className={`cursor-pointer rounded-2xl border border-[color:var(--border)] bg-[var(--bg-card)] p-4 text-left transition hover:bg-[var(--bg-card-hover)] ${highlightId === c.id ? 'ring-1 ring-[var(--accent-blue)]' : ''}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <CoinLogo src={c.image} alt="" className="h-10 w-10" symbol={c.symbol} />
              <div className="min-w-0">
                <div className="truncate font-semibold">{c.name}</div>
                <div className="text-xs uppercase text-[var(--text-muted)]">{c.symbol}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleWatchlist(c.id)
              }}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border)] ${wlSet.has(c.id) ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)]'}`}
            >
              <Star className="h-4 w-4" fill={wlSet.has(c.id) ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-lg font-bold tabular-nums">{formatUsd(c.current_price)}</div>
              <div className="mt-2">
                <PriceChange value={c.price_change_percentage_24h} />
              </div>
            </div>
            <div className="h-10 w-[100px]">
              <RowSparkline prices={c.sparkline_in_7d?.price} />
            </div>
          </div>

          <div className="mt-5 border-t border-[color:rgba(99,130,255,0.10)] pt-4 text-xs text-[var(--text-muted)]">
            Vốn hóa:{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {formatCompactCapVol(c.market_cap)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
