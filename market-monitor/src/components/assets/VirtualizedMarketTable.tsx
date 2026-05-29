import { useVirtualizer } from '@tanstack/react-virtual'
import { Star } from 'lucide-react'
import { useRef } from 'react'
import type { CoinMarket } from '../../types'
import { formatCompactCapVol, formatUsd } from '../../utils/formatNumber'
import { RowSparkline } from '../charts/RowSparkline'
import { CoinLogo } from '../shared/CoinLogo'
import { FlashPrice } from '../shared/FlashPrice'
import { PriceChange } from '../shared/PriceChange'

interface VirtualizedMarketTableProps {
  coins: CoinMarket[]
  wlSet: Set<string>
  onToggleWatchlist: (id: string) => void
  onOpen: (coin: CoinMarket) => void
  rowHighlightId?: string | null
}

const ROWHeight = 64

export function VirtualizedMarketTable({
  coins,
  wlSet,
  onToggleWatchlist,
  onOpen,
  rowHighlightId,
}: VirtualizedMarketTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const shouldVirtualize = coins.length > 50

  /* eslint-disable react-hooks/incompatible-library -- TanStack Virtual virtualizer APIs */
  const virtualizer = useVirtualizer({
    count: coins.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROWHeight,
    overscan: 10,
    enabled: shouldVirtualize,
  })
  /* eslint-enable react-hooks/incompatible-library */

  if (!shouldVirtualize) {
    return (
      <table className="w-full min-w-[920px] border-collapse text-sm">
        <thead className="bg-[var(--bg-base)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          <tr>
            <th className="px-5 py-3">TÀI SẢN</th>
            <th className="px-3 py-3">GIÁ (USD)</th>
            <th className="px-3 py-3">THAY ĐỔI 24H</th>
            <th className="px-3 py-3">VỐN HÓA</th>
            <th className="px-3 py-3">KHỐI LƯỢNG 24H</th>
            <th className="px-3 py-3">7 NGÀY</th>
            <th className="px-5 py-3 text-right">THÊM</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((c) => (
            <tr
              key={c.id}
              id={`coin-row-${c.id}`}
              onClick={() => onOpen(c)}
              className={`cursor-pointer border-t border-[color:rgba(99,130,255,0.10)] transition hover:bg-[var(--bg-card-hover)] ${rowHighlightId === c.id ? 'ring-1 ring-inset ring-[var(--accent-blue)] bg-[rgba(59,130,246,0.07)]' : ''}`}
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <CoinLogo src={c.image} alt="" className="h-9 w-9" symbol={c.symbol} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{c.name}</div>
                    <div className="text-xs uppercase text-[var(--text-muted)]">{c.symbol}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-4 tabular-nums">
                <FlashPrice valueKey={c.current_price}>
                  <span
                    className={`font-semibold ${(c.price_change_percentage_24h ?? 0) >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}
                  >
                    {formatUsd(c.current_price)}
                  </span>
                </FlashPrice>
              </td>
              <td className="px-3 py-4">
                <PriceChange value={c.price_change_percentage_24h} decimals={2} />
              </td>
              <td className="px-3 py-4 tabular-nums text-[var(--text-muted)]">
                {formatCompactCapVol(c.market_cap)}
              </td>
              <td className="px-3 py-4 tabular-nums text-[var(--text-muted)]">
                {formatCompactCapVol(c.total_volume)}
              </td>
              <td className="px-3 py-4">
                <RowSparkline prices={c.sparkline_in_7d?.price} />
              </td>
              <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  aria-label={wlSet.has(c.id) ? 'Bỏ theo dõi' : 'Thêm theo dõi'}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border)] transition hover:bg-[var(--bg-card-hover)] ${wlSet.has(c.id) ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)]'}`}
                  onClick={() => onToggleWatchlist(c.id)}
                >
                  <Star className="h-4 w-4" fill={wlSet.has(c.id) ? 'currentColor' : 'none'} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const virtualRows = virtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className="max-h-[640px] overflow-auto scrollbar-dark">
      <div className="min-w-[920px]">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--bg-base)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-5 py-3">TÀI SẢN</th>
              <th className="px-3 py-3">GIÁ (USD)</th>
              <th className="px-3 py-3">THAY ĐỔI 24H</th>
              <th className="px-3 py-3">VỐN HÓA</th>
              <th className="px-3 py-3">KHỐI LƯỢNG 24H</th>
              <th className="px-3 py-3">7 NGÀY</th>
              <th className="px-5 py-3 text-right">THÊM</th>
            </tr>
          </thead>
        </table>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualRows.map((vr) => {
            const c = coins[vr.index]
            return (
              <div
                key={c.id}
                id={`coin-row-${c.id}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${vr.start}px)`,
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  className={`flex cursor-pointer border-t border-[color:rgba(99,130,255,0.10)] hover:bg-[var(--bg-card-hover)] ${rowHighlightId === c.id ? 'ring-1 ring-inset ring-[var(--accent-blue)] bg-[rgba(59,130,246,0.07)]' : ''}`}
                  onClick={() => onOpen(c)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onOpen(c)
                  }}
                >
                  <div className="flex w-full min-w-[920px] items-center text-sm">
                    <div className="w-[220px] px-5 py-3">
                      <div className="flex items-center gap-3">
                        <CoinLogo src={c.image} alt="" className="h-9 w-9" symbol={c.symbol} />
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{c.name}</div>
                          <div className="text-xs uppercase text-[var(--text-muted)]">{c.symbol}</div>
                        </div>
                      </div>
                    </div>
                    <div className="w-[120px] px-3 py-3 tabular-nums">
                      <FlashPrice valueKey={c.current_price}>
                        <span
                          className={`font-semibold ${(c.price_change_percentage_24h ?? 0) >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}
                        >
                          {formatUsd(c.current_price)}
                        </span>
                      </FlashPrice>
                    </div>
                    <div className="w-[120px] px-3 py-3">
                      <PriceChange value={c.price_change_percentage_24h} decimals={2} />
                    </div>
                    <div className="w-[120px] px-3 py-3 tabular-nums text-[var(--text-muted)]">
                      {formatCompactCapVol(c.market_cap)}
                    </div>
                    <div className="w-[130px] px-3 py-3 tabular-nums text-[var(--text-muted)]">
                      {formatCompactCapVol(c.total_volume)}
                    </div>
                    <div className="w-[120px] px-3 py-3">
                      <RowSparkline prices={c.sparkline_in_7d?.price} />
                    </div>
                    <div
                      className="ml-auto shrink-0 px-5 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border)] transition hover:bg-[var(--bg-card-hover)] ${wlSet.has(c.id) ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)]'}`}
                        onClick={() => onToggleWatchlist(c.id)}
                      >
                        <Star className="h-4 w-4" fill={wlSet.has(c.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
