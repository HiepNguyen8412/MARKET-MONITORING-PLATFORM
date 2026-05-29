export function deltaPercent(series: number[]): number | null {
  if (series.length < 2) return null
  const a = series[series.length - 2]
  const b = series[series.length - 1]
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  if (a === 0) return null
  return ((b - a) / Math.abs(a)) * 100
}
