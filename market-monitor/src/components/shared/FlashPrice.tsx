import { useEffect, useRef, useState } from 'react'

interface FlashPriceProps {
  children: React.ReactNode
  valueKey: string | number | null | undefined
}

export function FlashPrice({ children, valueKey }: FlashPriceProps) {
  const prev = useRef(valueKey)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    const a = prev.current
    const b = valueKey
    prev.current = b

    if (
      typeof a === 'number' &&
      typeof b === 'number' &&
      !Number.isNaN(a) &&
      !Number.isNaN(b) &&
      b !== a
    ) {
      setFlash(b >= a ? 'up' : 'down')
      const t = window.setTimeout(() => setFlash(null), 520)
      return () => window.clearTimeout(t)
    }
    return
  }, [valueKey])

  return (
    <span
      className={`tabular-nums transition-colors rounded px-1 -mx-1 ${flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''}`}
    >
      {children}
    </span>
  )
}
