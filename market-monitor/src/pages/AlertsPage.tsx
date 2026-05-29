import { BellRing, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CoinLogo } from '../components/shared/CoinLogo'
import { LoadingSkeleton } from '../components/shared/LoadingSkeleton'
import { useMarketDataContext } from '../context/marketDataContext'
import { useAlertsStore } from '../stores/alertsStore'
import type { AlertRule } from '../types'
import { formatUsd } from '../utils/formatNumber'

function conditionLabel(c: AlertRule['condition']) {
  if (c === 'above') return 'Goes Above'
  if (c === 'below') return 'Goes Below'
  return 'Changes by %'
}

function targetLabel(a: AlertRule) {
  if (a.condition === 'pct') return `${a.target}%`
  return formatUsd(a.target)
}

export function AlertsPage() {
  const { markets, loading } = useMarketDataContext()
  const alerts = useAlertsStore((s) => s.alerts)
  const addAlert = useAlertsStore((s) => s.add)
  const removeAlert = useAlertsStore((s) => s.remove)
  const updateFromPrices = useAlertsStore((s) => s.updateFromPrices)
  const markNotified = useAlertsStore((s) => s.markNotified)

  const [coinId, setCoinId] = useState<string>('')
  const [comboOpen, setComboOpen] = useState(false)
  const [comboQuery, setComboQuery] = useState('')
  const dq = comboQuery.trim().toLowerCase()

  const [condition, setCondition] = useState<AlertRule['condition']>('above')
  const [targetStr, setTargetStr] = useState('')

  const coinOptions = useMemo(() => {
    const list = markets.slice(0, 20)
    if (!dq) return list
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(dq) ||
        c.symbol.toLowerCase().includes(dq) ||
        c.id.toLowerCase().includes(dq),
    )
  }, [markets, dq])

  const selectedCoin = useMemo(
    () => markets.find((c) => c.id === coinId) ?? null,
    [markets, coinId],
  )

  const baselinePrice =
    typeof selectedCoin?.current_price === 'number' &&
    Number.isFinite(selectedCoin.current_price)
      ? selectedCoin.current_price
      : null

  const targetParsed = Number(targetStr)
  const formValid =
    !!selectedCoin &&
    Number.isFinite(targetParsed) &&
    targetParsed > 0 &&
    (condition !== 'pct' || baselinePrice !== null)

  const notifyIfNeeded = useCallback(
    (newTriggers: AlertRule[]) => {
      if (!newTriggers.length) return
      if (typeof Notification === 'undefined') {
        markNotified(newTriggers.map((a) => a.id))
        return
      }
      if (Notification.permission === 'granted') {
        for (const a of newTriggers) {
          try {
            new Notification('Market Monitor', {
              body: `${a.coinName}: cảnh báo đã kích hoạt (${conditionLabel(a.condition)})`,
            })
          } catch {
            /* ignore */
          }
        }
        markNotified(newTriggers.map((a) => a.id))
        return
      }
      markNotified(newTriggers.map((a) => a.id))
    },
    [markNotified],
  )

  const evaluate = useCallback(() => {
    const getPrice = (id: string) =>
      markets.find((m) => m.id === id)?.current_price ?? null
    const { newTriggers } = updateFromPrices(getPrice)
    const fresh = newTriggers.filter((a) => !a.notified)
    notifyIfNeeded(fresh)
  }, [markets, notifyIfNeeded, updateFromPrices])

  useEffect(() => {
    evaluate()
    const id = window.setInterval(evaluate, 60_000)
    return () => window.clearInterval(id)
  }, [evaluate])

  const requestNotif = async () => {
    if (typeof Notification === 'undefined') return
    await Notification.requestPermission()
  }

  const onAdd = () => {
    if (!selectedCoin || !formValid) return
    const target = targetParsed
    addAlert({
      coinId: selectedCoin.id,
      coinName: selectedCoin.name,
      coinSymbol: selectedCoin.symbol,
      coinImage: selectedCoin.image,
      condition,
      target,
      baselinePrice: baselinePrice ?? selectedCoin.current_price ?? 0,
    })
    setTargetStr('')
    setCoinId('')
    setComboQuery('')
  }

  return (
    <div className="space-y-8 md:pt-0 pt-12">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Cảnh báo</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Tạo cảnh báo giá; hệ thống kiểm tra mỗi 60 giây và có thể gửi thông báo trình duyệt.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void requestNotif()}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-card-hover)]"
        >
          <BellRing className="h-4 w-4 text-[var(--accent-cyan)]" />
          Bật thông báo
        </button>
      </header>

      <section className="rounded-2xl border border-[color:var(--border)] bg-[var(--bg-card)] p-5 md:p-6">
        <div className="mb-5 text-lg font-bold">Create New Alert</div>

        {loading && !markets.length ? (
          <LoadingSkeleton className="h-40 w-full rounded-xl" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Tài sản
              </label>
              <input
                value={comboQuery}
                onFocus={() => setComboOpen(true)}
                onBlur={() => window.setTimeout(() => setComboOpen(false), 120)}
                onChange={(e) => {
                  setComboOpen(true)
                  setComboQuery(e.target.value)
                }}
                placeholder="Tìm coin (top 20)..."
                className="h-11 w-full rounded-xl border border-[color:var(--border)] bg-[var(--bg-base)] px-3 text-sm outline-none ring-[var(--accent-blue)] focus:ring-2"
              />
              {selectedCoin ? (
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-[color:rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.08)] px-3 py-2 text-sm">
                  <CoinLogo
                    src={selectedCoin.image}
                    alt=""
                    className="h-7 w-7"
                    symbol={selectedCoin.symbol}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{selectedCoin.name}</div>
                    <div className="text-xs uppercase text-[var(--text-muted)]">
                      {selectedCoin.symbol}
                    </div>
                  </div>
                </div>
              ) : null}
              {comboOpen ? (
                <div className="tooltip-animate absolute left-0 right-0 top-[calc(100%-6px)] z-50 max-h-64 overflow-y-auto scrollbar-dark rounded-xl border border-[color:var(--border)] bg-[var(--bg-card)] shadow-xl shadow-black/40">
                  {!coinOptions.length ? (
                    <div className="px-4 py-3 text-sm text-[var(--text-muted)]">
                      Không có kết quả.
                    </div>
                  ) : (
                    coinOptions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-card-hover)]"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setCoinId(c.id)
                          setComboQuery(`${c.name} (${c.symbol.toUpperCase()})`)
                          setComboOpen(false)
                        }}
                      >
                        <CoinLogo src={c.image} alt="" className="h-8 w-8" symbol={c.symbol} />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{c.name}</div>
                          <div className="text-xs uppercase text-[var(--text-muted)]">
                            {c.symbol}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Điều kiện
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as AlertRule['condition'])}
                className="h-11 w-full rounded-xl border border-[color:var(--border)] bg-[var(--bg-base)] px-3 text-sm outline-none ring-[var(--accent-blue)] focus:ring-2"
              >
                <option value="above">Goes Above</option>
                <option value="below">Goes Below</option>
                <option value="pct">Changes by %</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {condition === 'pct' ? 'Ngưỡng %' : 'Mức giá mục tiêu'}
              </label>
              <div className="relative">
                {condition === 'pct' ? (
                  <div className="relative">
                    <input
                      inputMode="decimal"
                      value={targetStr}
                      onChange={(e) => setTargetStr(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[color:var(--border)] bg-[var(--bg-base)] pl-3 pr-10 text-sm outline-none ring-[var(--accent-blue)] focus:ring-2"
                      placeholder="Ví dụ: 2.5"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">
                      %
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">
                      $
                    </span>
                    <input
                      inputMode="decimal"
                      value={targetStr}
                      onChange={(e) => setTargetStr(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[color:var(--border)] bg-[var(--bg-base)] pl-8 pr-3 text-sm outline-none ring-[var(--accent-blue)] focus:ring-2"
                      placeholder="0.00"
                    />
                  </>
                )}
              </div>
              {condition === 'pct' && baselinePrice === null ? (
                <p className="mt-2 text-xs text-[var(--red)]">
                  Chưa có giá hiện tại để tính %.
                </p>
              ) : null}
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="button"
                disabled={!formValid}
                onClick={onAdd}
                className="rounded-full bg-[var(--accent-blue)] px-6 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add Alert
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Active Alerts</h2>
          <span className="text-sm text-[var(--text-muted)]">{alerts.length} cảnh báo</span>
        </div>

        {!alerts.length ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--bg-card)] px-6 py-10 text-center text-sm text-[var(--text-muted)]">
            Chưa có cảnh báo nào.
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => {
              const current = markets.find((m) => m.id === a.coinId)?.current_price ?? null
              const triggeredStyle =
                a.triggered && a.condition === 'below'
                  ? 'bg-[rgba(239,68,68,0.12)] text-[var(--red)] border-[rgba(239,68,68,0.35)]'
                  : a.triggered
                    ? 'bg-[rgba(34,197,94,0.12)] text-[var(--green)] border-[rgba(34,197,94,0.35)]'
                    : 'bg-[rgba(99,130,255,0.08)] text-[var(--text-muted)] border-[color:var(--border)]'

              return (
                <div
                  key={a.id}
                  className="flex flex-col gap-4 rounded-2xl border border-[color:var(--border)] bg-[var(--bg-card)] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <CoinLogo
                      src={a.coinImage}
                      alt=""
                      className="h-10 w-10"
                      symbol={a.coinSymbol}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{a.coinName}</div>
                      <div className="text-xs uppercase text-[var(--text-muted)]">
                        {a.coinSymbol}
                      </div>
                    </div>
                  </div>

                  <div className="grid flex-1 grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div>
                      <div className="text-[11px] uppercase text-[var(--text-muted)]">
                        Điều kiện
                      </div>
                      <div className="mt-1 font-semibold">{conditionLabel(a.condition)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase text-[var(--text-muted)]">
                        Mục tiêu
                      </div>
                      <div className="mt-1 font-semibold tabular-nums">{targetLabel(a)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase text-[var(--text-muted)]">
                        Giá hiện tại
                      </div>
                      <div className="mt-1 font-semibold tabular-nums">
                        {current !== null ? formatUsd(current) : '—'}
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-2 md:block">
                      <div className="text-[11px] uppercase text-[var(--text-muted)]">Trạng thái</div>
                      <div className="mt-1">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${triggeredStyle}`}
                        >
                          {a.triggered ? 'TRIGGERED' : 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Xóa"
                    className="inline-flex h-10 w-10 items-center justify-center self-end rounded-xl border border-[color:var(--border)] text-[var(--text-muted)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--red)] md:self-center"
                    onClick={() => removeAlert(a.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
