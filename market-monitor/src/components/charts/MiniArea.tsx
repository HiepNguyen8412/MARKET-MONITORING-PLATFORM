import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

interface MiniAreaProps {
  values?: number[]
  stroke?: string
}

export function MiniArea({
  values,
  stroke = 'var(--chart-stroke)',
}: MiniAreaProps) {
  const norm = values?.length ? values : [0, 0]
  const data = norm.map((v, i) => ({ i: `${i}`, v }))

  return (
    <div className="h-[52px] w-full opacity-90">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="miniAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" hide />
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            fill="url(#miniAreaFill)"
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
