import { useUiStore } from '../../stores/uiStore'

export function Toast() {
  const msg = useUiStore((s) => s.toastMessage)
  if (!msg) return null
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] max-w-[min(520px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-[color:var(--border)] bg-[var(--bg-card)] px-5 py-3 text-sm text-[var(--text-primary)] shadow-lg shadow-black/40">
      {msg}
    </div>
  )
}
