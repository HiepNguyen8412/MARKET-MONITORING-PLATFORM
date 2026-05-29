import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { MarketDataProvider } from './context/MarketDataProvider'
import { AlertsPage } from './pages/AlertsPage'
import { AssetsPage } from './pages/AssetsPage'
import { DashboardPage } from './pages/DashboardPage'

export default function App() {
  return (
    <MarketDataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MarketDataProvider>
  )
}
