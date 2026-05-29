import { Star, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CoinMarket } from '../../types'
import {
  fetchCoinDetailBasic,
  fetchCoinMarketChart7d,
} from '../../services/coingecko'
import { useWatchlistStore } from '../../stores/watchlistStore'
import { formatCompactCapVol, formatUsd } from '../../utils/formatNumber'
import { CoinLogo } from '../shared/CoinLogo'
import { ErrorState } from '../shared/ErrorState'
import { LoadingSkeleton } from '../shared/LoadingSkeleton'
import { PriceChange } from '../shared/PriceChange'

interface CoinDetailDrawerProps {
  coin: CoinMarket | null
  onClose: () => void
}

export function CoinDetailDrawer({ coin, onClose }: CoinDetailDrawerProps) {
  const [rows, setRows] = useState<{ t: string; p: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [detail, setDetail] = useState<{
    ath?: number
    supply?: number
    vol?: number
  } | null>(null)

  const toggle = useWatchlistStore((s) => s.toggle)
  const wlIds = useWatchlistStore((s) => s.idsList)
  const inWl = !!(coin && wlIds.includes(coin.id))

  useEffect(() => {
    if (!coin) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const [chart, d] = await Promise.all([
          fetchCoinMarketChart7d(coin.id),
          fetchCoinDetailBasic(coin.id),
        ])
        if (cancelled) return
        const pts =
          chart.prices?.map(([ts, p]) => ({
            t: new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            p,
          })) ?? []
        setRows(pts)
        const md = (
          d as {
            ath?: { usd?: number }
            circulating_supply?: number
            market_data?: {
              ath?: { usd?: number }
              circulating_supply?: number
              total_volume?: { usd?: number }
            }
          }
        ).market_data
        const root = d as { ath?: { usd?: number }; circulating_supply?: number }
        setDetail({
          ath: md?.ath?.usd ?? root.ath?.usd,
          supply: md?.circulating_supply ?? root.circulating_supply,
          vol: md?.total_volume?.usd,
        })
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Lỗi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [coin])

  if (!coin) return null

  return (
    <>
      <button
        type="button"
        aria-label="Đóng"
        className="fixed inset-0 z-[70] bg-black/60"
        onClick={onClose}
      />
      <aside className="scrollbar-dark fixed inset-y-0 right-0 z-[80] w-full max-w-md overflow-y-auto border-l border-[color:var(--border)] bg-[var(--bg-card)] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[color:rgba(99,130,255,0.12)] px-6 py-5">
          <div className="flex items-center gap-3">
            <CoinLogo src={coin.image} alt="" className="h-11 w-11" symbol={coin.symbol} />
            <div>
              <div className="text-lg font-bold">{coin.name}</div>
              <div className="text-xs uppercase text-[var(--text-muted)]">{coin.symbol}</div>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-[color:var(--border)] bg-[var(--bg-base)] p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm text-[var(--text-muted)]">Giá hiện tại</div>
              <div className="mt-1 text-3xl font-bold tabular-nums">{formatUsd(coin.current_price)}</div>
            </div>
            <PriceChange value={coin.price_change_percentage_24h} />
          </div>

          {loading ? (
            <LoadingSkeleton className="h-[220px] w-full rounded-xl" />
          ) : err ? (
            <ErrorState message={err} />
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rows.length ? rows : [{ t: '—', p: 0 }]}>
                  <defs>
                    <linearGradient id="coin7d" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(59,130,246,0.28)" />
                      <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(99,130,255,0.12)" />
                  <XAxis dataKey="t" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis hide domain={['dataMin', 'dataMax']} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,22,41,0.96)',
                      border: '1px solid rgba(99,130,255,0.18)',
                      borderRadius: 12,
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="p"
                    stroke="var(--chart-stroke)"
                    fill="url(#coin7d)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 rounded-xl border border-[color:var(--border)] bg-[var(--bg-base)] p-4 text-sm">
            <StatLine label="ATH (USD)" value={detail?.ath !== undefined ? formatUsd(detail.ath) : '—'} />
            <StatLine
              label="Cung lưu hành"
              value={
                detail?.supply !== undefined
                  ? `${detail.supply.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  : '—'
              }
            />
            <StatLine
              label="Khối lượng"
              value={detail?.vol !== undefined ? formatCompactCapVol(detail.vol) : '—'}
            />
          </div>

          <button
            type="button"
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--border)] bg-[rgba(59,130,246,0.14)] px-4 py-3 text-sm font-semibold transition hover:bg-[rgba(59,130,246,0.22)]`}
            onClick={() => toggle(coin.id)}
          >
            <Star className="h-4 w-4" fill={inWl ? 'currentColor' : 'none'} />
            {inWl ? 'Đã trong danh sách theo dõi' : 'Thêm vào danh sách'}
          </button>
        </div>
      </aside>
    </>
  )
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-semibold tabular-nums text-[var(--text-primary)]">{value}</span>
    </div>
  )
}
