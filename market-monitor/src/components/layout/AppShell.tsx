import type { ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { OfflineBanner } from '../system/OfflineBanner'
import { RateLimitBanner } from '../system/RateLimitBanner'
import { Toast } from '../system/Toast'

export function AppShell({ children }: { children?: ReactNode }) {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-[color:var(--bg-base)] text-[color:var(--text-primary)]">
      <Sidebar />
      <div className="relative flex min-h-screen flex-1 flex-col md:pl-[220px]">
        <OfflineBanner />
        <RateLimitBanner />
        <Toast />
        <main className="mx-auto w-full max-w-[1260px] flex-1 px-4 pb-14 pt-6 md:px-10 md:pb-16 md:pt-10">
          <div key={location.pathname} className="page-transition">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}
