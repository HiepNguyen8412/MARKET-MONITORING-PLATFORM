import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CoinMarket, GlobalApiResponse, MarketChartPrices } from '../types'
import {
  RateLimitError,
  fetchBtcMarketChart24h,
  fetchGlobal,
  fetchMarkets,
} from '../services/coingecko'

const REFRESH_MS = 60_000
const HISTORY_MAX = 14

function bumpSeries(arr: number[], next: number): number[] {
  if (arr.length && arr[arr.length - 1] === next) return arr
  const merged = [...arr, next]
  return merged.length > HISTORY_MAX
    ? merged.slice(merged.length - HISTORY_MAX)
    : merged
}

export interface BtcChartRow {
  label: string
  ts: number
  price: number
}

export interface UseMarketDataResult {
  global: GlobalApiResponse | null
  markets: CoinMarket[]
  btcChartRows: BtcChartRow[]
  btcChange24h: number | null
  loading: boolean
  error: string | null
  isStale: boolean
  retryAfterSeconds: number | null
  rateLimitCountdown: number | null
  offline: boolean
  lastUpdated: number | null
  refresh: () => Promise<void>
  sparklineSeries: {
    activeCrypto: number[]
    volumeUsd: number[]
    mcapUsd: number[]
  }
}

function buildBtcRows(chart: MarketChartPrices | null): BtcChartRow[] {
  if (!chart?.prices?.length) return []
  return chart.prices.map(([ts, price]) => {
    const d = new Date(ts)
    const label = `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
    return { label, ts, price }
  })
}

export function useMarketData(): UseMarketDataResult {
  const [global, setGlobal] = useState<GlobalApiResponse | null>(null)
  const [markets, setMarkets] = useState<CoinMarket[]>([])
  const [btcChart, setBtcChart] = useState<MarketChartPrices | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(
    null,
  )
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(
    null,
  )
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  )
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [sparklineSeries, setSparklineSeries] = useState({
    activeCrypto: [] as number[],
    volumeUsd: [] as number[],
    mcapUsd: [] as number[],
  })
  const lastGoodRef = useRef<{
    global: GlobalApiResponse | null
    markets: CoinMarket[]
    btcChart: MarketChartPrices | null
  }>({ global: null, markets: [], btcChart: null })
  const abortRef = useRef(false)

  const load = useCallback(async () => {
    setOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false)
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError('offline')
      setIsStale(true)
      setLoading(false)
      return
    }

    setError(null)
    setRetryAfterSeconds(null)

    try {
      const [g, mkt, btc] = await Promise.all([
        fetchGlobal(),
        fetchMarkets({ page: 1, perPage: 20 }),
        fetchBtcMarketChart24h(),
      ])

      if (abortRef.current) return

      setGlobal(g)
      setMarkets(mkt)
      setBtcChart(btc)
      lastGoodRef.current = {
        global: g,
        markets: mkt,
        btcChart: btc,
      }

      const d = g.data
      setSparklineSeries((prev) => ({
        activeCrypto: bumpSeries(prev.activeCrypto, d.active_cryptocurrencies),
        volumeUsd: bumpSeries(prev.volumeUsd, d.total_volume?.usd ?? 0),
        mcapUsd: bumpSeries(prev.mcapUsd, d.total_market_cap?.usd ?? 0),
      }))

      setLastUpdated(Date.now())
      setIsStale(false)
      setRetryAfterSeconds(null)
      setRateLimitCountdown(null)
    } catch (e: unknown) {
      const rl = e instanceof RateLimitError ? e.retryAfterSeconds : null

      if (rl !== null) {
        setRetryAfterSeconds(rl)
        setRateLimitCountdown(rl)
        setIsStale(true)
      } else {
        setError(e instanceof Error ? e.message : 'Lỗi không xác định')
        setIsStale(true)
      }

      if (lastGoodRef.current.global || lastGoodRef.current.markets.length) {
        setGlobal(lastGoodRef.current.global)
        setMarkets(lastGoodRef.current.markets)
        setBtcChart(lastGoodRef.current.btcChart)
      }
    } finally {
      if (!abortRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    abortRef.current = false
    queueMicrotask(() => {
      void load()
    })

    const id = window.setInterval(() => void load(), REFRESH_MS)

    const onOnline = () => {
      setOffline(false)
      void load()
    }
    const onOffline = () => setOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      abortRef.current = true
      window.clearInterval(id)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [load])

  useEffect(() => {
    if (rateLimitCountdown === null || rateLimitCountdown <= 0) return
    const t = window.setInterval(() => {
      setRateLimitCountdown((c) => {
        if (c === null || c <= 1) {
          window.clearInterval(t)
          void load()
          return null
        }
        return c - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [rateLimitCountdown, load])

  const btcChartRows = useMemo(() => buildBtcRows(btcChart), [btcChart])

  const btcChange24h = useMemo(() => {
    const btc = markets.find((c) => c.id === 'bitcoin')
    return btc?.price_change_percentage_24h ?? null
  }, [markets])

  return {
    global,
    markets,
    btcChartRows,
    btcChange24h,
    loading,
    error,
    isStale,
    retryAfterSeconds,
    rateLimitCountdown,
    offline,
    lastUpdated,
    refresh: load,
    sparklineSeries,
  }
}
