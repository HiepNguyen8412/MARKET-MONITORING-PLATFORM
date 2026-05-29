const UNITS = [
  { s: 'T', m: 1e12 },
  { s: 'B', m: 1e9 },
  { s: 'M', m: 1e6 },
  { s: 'K', m: 1e3 },
] as const

function formatCompactUsd(value: number, fractionDigits = 2): string {
  const neg = value < 0
  let v = Math.abs(value)

  let suffix = ''
  for (const u of UNITS) {
    if (v >= u.m) {
      suffix = u.s
      v = v / u.m
      break
    }
  }

  const num = suffix
    ? v.toLocaleString(undefined, {
        minimumFractionDigits: Math.min(fractionDigits, 2),
        maximumFractionDigits: fractionDigits,
      })
    : v.toLocaleString(undefined, { maximumFractionDigits: 0 })

  return `${neg ? '-' : ''}$${num}${suffix}`
}

export function formatUsd(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'

  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: value >= 1 && value < 100 ? 4 : value >= 100 ? 2 : 6,
  })}`
}

export function formatCompactCapVol(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return formatCompactUsd(value, 2)
}

export function formatPercent(value?: number | null, decimals = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}
