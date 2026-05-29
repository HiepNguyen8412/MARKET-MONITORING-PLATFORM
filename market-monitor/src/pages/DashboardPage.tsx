import { Activity, ArrowDownRight, ArrowUpRight, BarChart2, Grid, Star } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MiniArea } from '../components/charts/MiniArea'
import { MiniBars } from '../components/charts/MiniBars'
import { RowSparkline } from '../components/charts/RowSparkline'
import { DashboardSearch } from '../components/dashboard/DashboardSearch'
import { MarketIndexChart } from '../components/dashboard/MarketIndexChart'
import { AnimatedNumber } from '../components/shared/AnimatedNumber'
import { CoinLogo } from '../components/shared/CoinLogo'
import { ErrorState } from '../components/shared/ErrorState'
import { FlashPrice } from '../components/shared/FlashPrice'
import { CardSkeleton, LoadingSkeleton } from '../components/shared/LoadingSkeleton'
import { PriceChange } from '../components/shared/PriceChange'
import { useMarketDataContext } from '../context/marketDataContext'
import { useWatchlistStore } from '../stores/watchlistStore'
import { deltaPercent } from '../utils/series'
import { formatCompactCapVol, formatUsd } from '../utils/formatNumber'

function StatBadge({
  value,
  decimals = 1,
}: {
  value: number | null
  decimals?: number
}) {
  if (value === null || Number.isNaN(value)) {
    return (
      <span className="rounded-full bg-[rgba(99,130,255,0.10)] px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)]">
        —
      </span>
    )
  }
  const up = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${up ? 'bg-[rgba(34,197,94,0.12)] text-[var(--green)]' : 'bg-[rgba(239,68,68,0.12)] text-[var(--red)]'}`}
    >
      {up ? (
        <ArrowUpRight className="h-3 w-3" aria-hidden />
      ) : (
        <ArrowDownRight className="h-3 w-3" aria-hidden />
      )}
      {`${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`}
    </span>
  )
}

export function DashboardPage() {
  const {
    global,
    markets,
    btcChartRows,
    btcChange24h,
    loading,
    error,
    offline,
    refresh,
    sparklineSeries,
  } = useMarketDataContext()

  const wlIds = useWatchlistStore((s) => s.idsList)
  const wlSet = useMemo(() => new Set(wlIds), [wlIds])
  const wlCount = wlIds.length
  const toggleWatchlist = useWatchlistStore((s) => s.toggle)

  const activeDelta = useMemo(() => deltaPercent(sparklineSeries.activeCrypto), [sparklineSeries.activeCrypto])
  const volumeDelta = useMemo(() => deltaPercent(sparklineSeries.volumeUsd), [sparklineSeries.volumeUsd])

  const mcapPct = global?.data.market_cap_change_percentage_24h_usd ?? null

  const top5 = useMemo(() => markets.slice(0, 5), [markets])

  const showSkeleton = loading && !global && !markets.length

  if (error && !global && !markets.length) {
    return (
      <ErrorState
        message={offline ? 'Ngoại tuyến — không thể tải dữ liệu.' : error}
        onRetry={() => void refresh()}
      />
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl space-y-2 md:pt-0 pt-12">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            <span className="text-[var(--text-primary)]">Thị trường </span>
            <span className="bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] bg-clip-text text-transparent">
              Trực tuyến
            </span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] md:text-base">
            Theo dõi biến động giá tài sản theo thời gian thực.
          </p>
        </div>
        <DashboardSearch />
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {showSkeleton ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <div
              className="animate-stagger rounded-xl border border-[color:var(--border)] bg-[var(--bg-card)] p-5"
              style={{ animationDelay: '0ms' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-[var(--text-muted)]">Tổng tài sản</div>
                  <div className="mt-2 text-3xl font-bold tabular-nums">
                    <AnimatedNumber value={wlCount} format={(v) => Math.round(v).toLocaleString()} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="rounded-xl border border-[color:var(--border)] bg-[var(--bg-base)] p-2 text-[var(--accent-blue)]">
                    <BarChart2 className="h-5 w-5" aria-hidden />
                  </div>
                  <StatBadge value={activeDelta} />
                </div>
              </div>
              <div className="mt-4">
                <MiniBars values={sparklineSeries.activeCrypto.length ? sparklineSeries.activeCrypto : [1]} />
              </div>
            </div>

            <div
              className="animate-stagger rounded-xl border border-[color:var(--border)] bg-[var(--bg-card)] p-5"
              style={{ animationDelay: '50ms' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-[var(--text-muted)]">Khối lượng 24h</div>
                  <div className="mt-2 truncate text-2xl font-bold md:text-3xl">
                    {global?.data.total_volume?.usd !== undefined ? (
                      <AnimatedNumber
                        value={global.data.total_volume.usd}
                        format={(v) => formatCompactCapVol(v)}
                      />
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="rounded-xl border border-[color:var(--border)] bg-[var(--bg-base)] p-2 text-[var(--accent-cyan)]">
                    <Activity className="h-5 w-5" aria-hidden />
                  </div>
                  <StatBadge value={volumeDelta} />
                </div>
              </div>
              <div className="mt-4">
                <MiniArea values={sparklineSeries.volumeUsd} />
              </div>
            </div>

            <div
              className="animate-stagger rounded-xl border border-[color:var(--border)] bg-[var(--bg-card)] p-5"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-[var(--text-muted)]">Vốn hóa thị trường</div>
                  <div className="mt-2 truncate text-2xl font-bold md:text-3xl">
                    {global?.data.total_market_cap?.usd !== undefined ? (
                      <AnimatedNumber
                        value={global.data.total_market_cap.usd}
                        format={(v) => formatCompactCapVol(v)}
                      />
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="rounded-xl border border-[color:var(--border)] bg-[var(--bg-base)] p-2 text-[var(--accent-blue)]">
                    <Grid className="h-5 w-5" aria-hidden />
                  </div>
                  <StatBadge value={mcapPct} />
                </div>
              </div>
              <div className="mt-4">
                <MiniArea values={sparklineSeries.mcapUsd} />
              </div>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-[color:var(--border)] bg-[var(--bg-card)] p-5 md:p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Chỉ số thị trường chung</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Xu hướng biến động trong 24 giờ qua
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.10)] px-3 py-1 text-xs font-semibold text-[var(--green)]">
            BTC{' '}
            {btcChange24h !== null && btcChange24h !== undefined ? (
              <>
                {btcChange24h >= 0 ? '↑' : '↓'} {btcChange24h >= 0 ? '+' : ''}
                {btcChange24h.toFixed(2)}%
              </>
            ) : (
              '—'
            )}
          </div>
        </div>

        {loading && !btcChartRows.length ? (
          <LoadingSkeleton className="h-[320px] w-full rounded-xl" />
        ) : (
          <MarketIndexChart rows={btcChartRows} />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Danh sách tài sản</h2>
          <Link
            to="/assets"
            className="text-sm font-semibold text-[var(--accent-cyan)] hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[var(--bg-card)]">
          <div className="scrollbar-dark overflow-x-auto">
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
                {loading && !top5.length ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-[color:rgba(99,130,255,0.10)]">
                      <td className="px-5 py-4" colSpan={7}>
                        <LoadingSkeleton className="h-10 w-full rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : (
                  top5.map((c) => {
                    const inWl = wlSet.has(c.id)
                    return (
                      <tr
                        key={c.id}
                        className="border-t border-[color:rgba(99,130,255,0.10)] transition hover:bg-[var(--bg-card-hover)]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <CoinLogo src={c.image} alt="" className="h-9 w-9" symbol={c.symbol} />
                            <div className="min-w-0">
                              <div className="truncate font-semibold">{c.name}</div>
                              <div className="text-xs uppercase text-[var(--text-muted)]">
                                {c.symbol}
                              </div>
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
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            aria-label={inWl ? 'Bỏ theo dõi' : 'Thêm theo dõi'}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border)] transition hover:bg-[var(--bg-card-hover)] ${inWl ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)]'}`}
                            onClick={() => toggleWatchlist(c.id)}
                          >
                            <Star className="h-4 w-4" fill={inWl ? 'currentColor' : 'none'} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
