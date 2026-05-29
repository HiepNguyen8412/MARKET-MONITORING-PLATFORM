import { useState } from 'react'

interface CoinLogoProps {
  src?: string | null
  alt: string
  className?: string
  symbol?: string
}

export function CoinLogo({ src, alt, className, symbol }: CoinLogoProps) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    const letter = (symbol ?? alt ?? '?').slice(0, 1).toUpperCase()
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-[var(--bg-card-hover)] text-xs font-semibold text-[var(--text-muted)] ${className ?? ''}`}
        aria-label={alt}
      >
        {letter}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt=""
      role="presentation"
      className={`shrink-0 overflow-hidden rounded-full object-cover ${className ?? ''}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
