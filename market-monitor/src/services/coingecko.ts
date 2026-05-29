import type {
  CoinMarket,
  GlobalApiResponse,
  MarketChartPrices,
  SearchCoin,
} from '../types'

const BASE = 'https://api.coingecko.com/api/v3'

export class RateLimitError extends Error {
  retryAfterSeconds: number

  constructor(message: string, retryAfterSeconds: number) {
    super(message)
    this.name = 'RateLimitError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

interface CacheEntry<T> {
  data: T
  at: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const TTL_MS = 30_000

function cacheKey(parts: string[]): string {
  return parts.join('|')
}

async function getJson<T>(path: string, search = ''): Promise<T> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new NetworkError('offline')
  }

  const url = `${BASE}${path}${search}`
  const key = cacheKey([path, search])
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.at < TTL_MS) {
    return hit.data as T
  }

  const res = await fetch(url)
  if (res.status === 429) {
    const ra = Number(res.headers.get('retry-after')) || 60
    throw new RateLimitError('rate limited', ra)
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  const data = (await res.json()) as T
  cache.set(key, { data, at: now })
  return data
}

export function invalidateCoingeckoCache(prefix?: string) {
  if (!prefix) {
    cache.clear()
    return
  }
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) cache.delete(k)
  }
}

export function fetchGlobal(): Promise<GlobalApiResponse> {
  return getJson<GlobalApiResponse>('/global')
}

export function fetchMarkets(params: {
  page: number
  perPage: number
}): Promise<CoinMarket[]> {
  const search = `?vs_currency=usd&order=market_cap_desc&sparkline=true&per_page=${params.perPage}&page=${params.page}`
  return getJson<CoinMarket[]>('/coins/markets', search)
}

export function fetchBtcMarketChart24h(): Promise<MarketChartPrices> {
  const search =
    '?vs_currency=usd&days=1&interval=hourly'
  return getJson<MarketChartPrices>('/coins/bitcoin/market_chart', search)
}

export function fetchCoinMarketChart7d(coinId: string): Promise<MarketChartPrices> {
  const search = '?vs_currency=usd&days=7'
  return getJson<MarketChartPrices>(
    `/coins/${encodeURIComponent(coinId)}/market_chart`,
    search,
  )
}

export async function fetchCoinDetailBasic(coinId: string): Promise<{
  ath?: { usd?: number }
  circulating_supply?: number
  market_data?: {
    ath?: { usd?: number }
    circulating_supply?: number
    total_volume?: { usd?: number }
  }
}> {
  const search =
    '?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false'
  return getJson(`/coins/${encodeURIComponent(coinId)}`, search)
}

export async function searchCoins(query: string): Promise<SearchCoin[]> {
  const q = query.trim()
  if (!q) return []
  const key = cacheKey(['/search', q])
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.at < TTL_MS) {
    return hit.data as SearchCoin[]
  }

  const res = await fetch(
    `${BASE}/search?query=${encodeURIComponent(q)}`,
  )
  if (res.status === 429) {
    const ra = Number(res.headers.get('retry-after')) || 60
    throw new RateLimitError('rate limited', ra)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = (await res.json()) as {
    coins?: { id: string; symbol: string; name: string; thumb: string }[]
  }
  const coins =
    json.coins?.slice(0, 12).map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      thumb: c.thumb,
    })) ?? []
  cache.set(key, { data: coins, at: now })
  return coins
}
