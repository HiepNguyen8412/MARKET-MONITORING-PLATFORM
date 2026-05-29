import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

interface MiniBarsProps {
  values?: number[]
}

export function MiniBars({ values }: MiniBarsProps) {
  const data = (values?.length ? values : [1, 1]).map((v, i) => ({
    i: `${i}`,
    v,
  }))

  return (
    <div className="h-[52px] w-full opacity-90">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="miniBarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.95} />
              <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity={0.25} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="transparent" />
          <XAxis dataKey="i" hide />
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Bar
            dataKey="v"
            fill="url(#miniBarFill)"
            radius={[4, 4, 0, 0]}
            maxBarSize={8}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
