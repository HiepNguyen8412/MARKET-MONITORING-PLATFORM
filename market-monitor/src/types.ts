export interface GlobalTotals {
  usd?: number
  [key: string]: unknown
}

export interface GlobalMarketDataPayload {
  active_cryptocurrencies: number
  markets: number
  total_market_cap: GlobalTotals
  total_volume: GlobalTotals
  market_cap_change_percentage_24h_usd: number | null
  market_cap_percentage: Record<string, number>
}

export interface GlobalApiResponse {
  data: GlobalMarketDataPayload
}

export interface SparklineData {
  price: number[]
}

export interface CoinMarket {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number | null
  market_cap: number | null
  fully_diluted_valuation?: number | null
  total_volume: number | null
  price_change_percentage_24h?: number | null
  market_cap_rank?: number
  sparkline_in_7d?: SparklineData
}

export interface MarketChartPrices {
  prices: [number, number][]
}

export interface SearchCoin {
  id: string
  symbol: string
  name: string
  thumb: string
}

export interface AlertRule {
  id: string
  coinId: string
  coinName: string
  coinSymbol: string
  coinImage?: string
  condition: 'above' | 'below' | 'pct'
  /** USD target for above/below, or threshold % for pct */
  target: number
  baselinePrice: number
  triggered: boolean
  triggeredAt?: number
  notified: boolean
  createdAt: number
}
