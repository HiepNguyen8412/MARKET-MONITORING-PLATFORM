interface ErrorStateProps {
  message?: string | null
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Thử lại',
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[color:rgba(239,68,68,.35)] bg-[color:rgba(239,68,68,.06)] px-6 py-10 text-center">
      <p className="text-sm text-[var(--text-muted)]">
        {message ?? 'Đã xảy ra lỗi khi tải dữ liệu.'}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-[var(--accent-blue)] px-5 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:brightness-110 active:scale-[0.98]"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  )
}
