import { Loader2, Search as SearchIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchCoins } from '../../services/coingecko'
import { CoinLogo } from '../shared/CoinLogo'

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return debounced
}

export function DashboardSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const dq = useDebounced(query, 300)
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchCoins>>>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!dq.trim()) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const list = await searchCoins(dq)
        if (!cancelled) setResults(list)
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dq])

  const panelVisible = open && dq.trim().length > 0

  const choose = useCallback(
    (id: string) => {
      navigate(`/assets?highlight=${encodeURIComponent(id)}`)
      setOpen(false)
      setQuery('')
    },
    [navigate],
  )

  const wrapper = useMemo(() => 'relative w-full md:max-w-[340px]', [])

  return (
    <div className={wrapper}>
      <SearchIcon
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
        aria-hidden
      />
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() =>
          window.setTimeout(() => setOpen(false), 140)
        }
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm kiếm tài sản (BTC, ETH, AA...)"
        className="h-11 w-full rounded-xl border border-[color:var(--border)] bg-[var(--bg-card-hover)] pl-10 pr-10 text-sm outline-none ring-[var(--accent-blue)] transition placeholder:text-[var(--text-muted)] focus:ring-2"
        autoComplete="off"
      />
      {loading ? (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--accent-cyan)]" aria-hidden />
      ) : null}

      {panelVisible ? (
        <div className="tooltip-animate absolute left-0 right-0 top-[calc(100%+8px)] z-[60] overflow-hidden rounded-xl border border-[color:var(--border)] bg-[var(--bg-card)] shadow-xl shadow-black/35">
          {!results.length ? (
            <div className="px-4 py-3 text-sm text-[var(--text-muted)]">
              Không thấy coin phù hợp.
            </div>
          ) : (
            <ul className="max-h-[320px] divide-y divide-[color:rgba(99,130,255,0.12)] overflow-y-auto scrollbar-dark">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-[var(--bg-card-hover)]"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(c.id)}
                  >
                    <CoinLogo src={c.thumb} alt="" className="h-8 w-8" symbol={c.symbol} />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{c.name}</div>
                      <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                        {c.symbol}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
