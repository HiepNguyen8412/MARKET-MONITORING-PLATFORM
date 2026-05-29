import {
  BarChart2,
  Bell,
  Menu,
  TrendingUp,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const pill =
  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition'

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `${pill} border border-transparent ${isActive ? 'border-[color:var(--border)] bg-[rgba(59,130,246,0.16)] text-[color:var(--text-primary)] shadow-inner' : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`

  const links = (
    <>
      <NavLink
        to="/dashboard"
        className={linkCls}
        onClick={() => setMobileOpen(false)}
      >
        <BarChart2 className="h-5 w-5 shrink-0 text-[var(--accent-blue)]" aria-hidden />
        Dashboard
      </NavLink>
      <NavLink
        to="/assets"
        className={linkCls}
        onClick={() => setMobileOpen(false)}
      >
        <TrendingUp className="h-5 w-5 shrink-0 text-[var(--accent-cyan)]" aria-hidden />
        Assets
      </NavLink>
      <NavLink
        to="/alerts"
        className={linkCls}
        onClick={() => setMobileOpen(false)}
      >
        <Bell className="h-5 w-5 shrink-0 text-[color:var(--accent-blue)]" aria-hidden />
        Alerts
      </NavLink>
    </>
  )

  return (
    <>
      <button
        type="button"
        aria-label="Mở menu"
        className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[var(--bg-card)] md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Đóng"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`scrollbar-dark fixed left-0 top-0 z-50 flex h-screen w-[220px] shrink-0 flex-col border-r border-[color:var(--border)] bg-[var(--bg-card)] px-4 py-8 transition-transform md:z-30 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="mb-10 flex items-center justify-between gap-2 px-2 md:block">
          <div className="bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] bg-clip-text text-lg font-bold tracking-tight text-transparent">
            Market Monitor
          </div>
          <button
            type="button"
            className="md:hidden rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2">{links}</nav>

        <div className="mt-auto rounded-xl border border-[color:var(--border)] bg-[var(--bg-base)] px-3 py-2 text-[11px] font-medium leading-snug text-[var(--text-muted)]">
          Chế độ xem công khai
        </div>
      </aside>
    </>
  )
}
