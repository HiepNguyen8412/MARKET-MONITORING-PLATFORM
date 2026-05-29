import { LayoutGrid, Table2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CoinDetailDrawer } from '../components/assets/CoinDetailDrawer'
import { CoinGrid } from '../components/assets/CoinGrid'
import { VirtualizedMarketTable } from '../components/assets/VirtualizedMarketTable'
import { ErrorState } from '../components/shared/ErrorState'
import { LoadingSkeleton } from '../components/shared/LoadingSkeleton'
import { useMarketDataContext } from '../context/marketDataContext'
import { fetchMarkets } from '../services/coingecko'
import type { CoinMarket } from '../types'
import { useWatchlistStore } from '../stores/watchlistStore'

type Tab = 'all' | 'gainers' | 'losers' | 'watchlist'
type View = 'grid' | 'table'

export function AssetsPage() {
  const { markets: baseMarkets, loading, error, offline, refresh, lastUpdated } =
    useMarketDataContext()
  const [page, setPage] = useState(1)
  const [extra, setExtra] = useState<CoinMarket[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [tab, setTab] = useState<Tab>('all')
  const [view, setView] = useState<View>('grid')
  const [selected, setSelected] = useState<CoinMarket | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const highlight = searchParams.get('highlight')

  const wlIds = useWatchlistStore((s) => s.idsList)
  const wlSet = useMemo(() => new Set(wlIds), [wlIds])
  const toggleWatchlist = useWatchlistStore((s) => s.toggle)

  useEffect(() => {
    queueMicrotask(() => {
      setPage(1)
      setExtra([])
    })
  }, [lastUpdated])

  const merged = useMemo(() => {
    const m = new Map<string, CoinMarket>()
    baseMarkets.forEach((c) => m.set(c.id, { ...c }))
    extra.forEach((c) => m.set(c.id, { ...c }))
    return Array.from(m.values())
  }, [baseMarkets, extra])

  const filtered = useMemo(() => {
    let list = [...merged]
    if (tab === 'gainers')
      list = list
        .filter((c) => (c.price_change_percentage_24h ?? 0) > 0)
        .sort(
          (a, b) =>
            (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0),
        )
    else if (tab === 'losers')
      list = list
        .filter((c) => (c.price_change_percentage_24h ?? 0) < 0)
        .sort(
          (a, b) =>
            (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0),
        )
    else if (tab === 'watchlist')
      list = list.filter((c) => wlSet.has(c.id))
    return list
  }, [merged, tab, wlSet])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      const next = page + 1
      const data = await fetchMarkets({ page: next, perPage: 20 })
      setExtra((e) => {
        const seen = new Set(e.map((x) => x.id))
        const add = data.filter((x) => !seen.has(x.id))
        return [...e, ...add]
      })
      setPage(next)
    } finally {
      setLoadingMore(false)
    }
  }, [page])

  useEffect(() => {
    if (!highlight) return
    const id = window.setTimeout(() => {
      const el = document.getElementById(`coin-row-${highlight}`)
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 300)
    return () => window.clearTimeout(id)
  }, [highlight, filtered.length, view])

  const clearHighlight = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete('highlight')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  if (error && !baseMarkets.length) {
    return (
      <ErrorState
        message={offline ? 'Ngoại tuyến — không thể tải dữ liệu.' : error}
        onRetry={() => void refresh()}
      />
    )
  }

  return (
    <div className="space-y-8 md:pt-0 pt-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Tài sản</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Danh sách thị trường đầy đủ, theo dõi yêu thích và chi tiết nhanh.
        </p>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'Tất cả'],
              ['gainers', 'Tăng giá'],
              ['losers', 'Giảm giá'],
              ['watchlist', 'Theo dõi'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === k ? 'bg-[rgba(59,130,246,0.18)] text-[var(--text-primary)] border border-[color:var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Lưới"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] ${view === 'grid' ? 'bg-[rgba(59,130,246,0.16)] text-[var(--accent-cyan)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Bảng"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] ${view === 'table' ? 'bg-[rgba(59,130,246,0.16)] text-[var(--accent-cyan)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            onClick={() => setView('table')}
          >
            <Table2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {highlight ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[color:rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.08)] px-4 py-3 text-sm">
          <span>
            Đang nhấn mạnh tài sản đã chọn.{' '}
            <span className="font-mono text-[var(--accent-cyan)]">{highlight}</span>
          </span>
          <button
            type="button"
            className="text-xs font-semibold text-[var(--accent-blue)] hover:underline"
            onClick={clearHighlight}
          >
            Bỏ nhấn
          </button>
        </div>
      ) : null}

      {loading && !merged.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-[180px] rounded-2xl" />
          ))}
        </div>
      ) : view === 'grid' ? (
        <CoinGrid
          coins={filtered}
          wlSet={wlSet}
          onToggleWatchlist={toggleWatchlist}
          onOpen={setSelected}
          highlightId={highlight}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[var(--bg-card)]">
          <VirtualizedMarketTable
            coins={filtered}
            wlSet={wlSet}
            onToggleWatchlist={toggleWatchlist}
            onOpen={setSelected}
            rowHighlightId={highlight}
          />
        </div>
      )}

      <div className="flex justify-center">
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => void loadMore()}
          className="rounded-full border border-[color:var(--border)] bg-[var(--bg-card)] px-6 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-card-hover)] disabled:opacity-50"
        >
          {loadingMore ? 'Đang tải...' : 'Tải thêm'}
        </button>
      </div>

      <CoinDetailDrawer coin={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
