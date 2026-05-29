import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

interface RowSparklineProps {
  prices?: number[]
}

export function RowSparkline({ prices }: RowSparklineProps) {
  const pts = prices?.length ? prices.slice(-32) : []
  const data = pts.map((p, i) => ({ i: String(i), p }))

  const up = pts.length >= 2 ? pts[pts.length - 1] >= pts[0] : true
  const stroke = up ? 'var(--green)' : 'var(--red)'

  return (
    <div className="h-9 w-[88px] shrink-0 opacity-90">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.length ? data : [{ i: '0', p: 0 }, { i: '1', p: 0 }]}>
          <XAxis dataKey="i" hide />
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line
            type="monotone"
            dataKey="p"
            stroke={stroke}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
