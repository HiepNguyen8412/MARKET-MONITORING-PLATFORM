import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  format: (v: number) => string
  durationMs?: number
  className?: string
}

export function AnimatedNumber({
  value,
  format,
  durationMs = 800,
  className,
}: AnimatedNumberProps) {
  const mounted = useRef(false)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      let raf = 0
      const start = performance.now()
      const from = 0
      const tick = (t: number) => {
        const k = Math.min((t - start) / durationMs, 1)
        const eased = 1 - Math.pow(1 - k, 2)
        setDisplay(from + (value - from) * eased)
        if (k < 1) raf = requestAnimationFrame(tick)
        else setDisplay(value)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }
    setDisplay(value)
    return
  }, [value, durationMs])

  return <span className={className}>{format(display)}</span>
}
