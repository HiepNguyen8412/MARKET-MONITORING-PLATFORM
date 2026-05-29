import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatUsd } from '../../utils/formatNumber'

interface Row {
  label: string
  ts: number
  price: number
}

interface MarketIndexChartProps {
  rows: Row[]
}

function TooltipPanel({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: Row }[]
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  const d = new Date(p.ts)
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="tooltip-animate rounded-xl border border-[color:var(--border)] bg-[rgba(15,22,41,0.96)] px-4 py-3 text-xs shadow-lg">
      <div className="text-[var(--text-muted)]">{time}</div>
      <div className="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">
        {formatUsd(p.price)}
      </div>
    </div>
  )
}

export function MarketIndexChart({ rows }: MarketIndexChartProps) {
  const data = rows.length ? rows : [{ label: '—', ts: 0, price: 0 }]

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="marketIndexFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(59,130,246,0.30)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0)" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(99,130,255,0.12)" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(99,130,255,0.20)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Tooltip
            content={<TooltipPanel />}
            cursor={{ stroke: 'rgba(99,130,255,0.25)' }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#marketIndexFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
