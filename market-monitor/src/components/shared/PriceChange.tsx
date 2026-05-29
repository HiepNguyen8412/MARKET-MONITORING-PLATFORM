import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatPercent } from '../../utils/formatNumber'

interface PriceChangeProps {
  value?: number | null
  decimals?: number
}

export function PriceChange({ value, decimals = 2 }: PriceChangeProps) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className="text-[var(--text-muted)] text-xs font-medium">—</span>
  }

  const up = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${up ? 'bg-[rgba(34,197,94,0.12)] text-[var(--green)]' : 'bg-[rgba(239,68,68,0.12)] text-[var(--red)]'}`}
    >
      {up ? (
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
      )}
      <span>{formatPercent(value, decimals)}</span>
    </span>
  )
}
