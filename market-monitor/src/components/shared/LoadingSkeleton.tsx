export function LoadingSkeleton({
  className,
}: {
  className?: string
}) {
  return <div className={`loading-skel ${className ?? 'h-4 w-full'}`} aria-hidden />
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-card)] p-5">
      <LoadingSkeleton className="mb-3 h-3 w-24 opacity-70" />
      <LoadingSkeleton className="mb-4 h-8 w-32" />
      <LoadingSkeleton className="h-[52px] w-full rounded-lg" />
    </div>
  )
}
