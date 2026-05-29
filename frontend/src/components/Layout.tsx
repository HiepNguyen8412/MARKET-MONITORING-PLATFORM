import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { TickerTape } from './TickerTape';
import { Search, Bell, LogOut, LogIn, X } from 'lucide-react';
import { useMarketStore } from '../store/useMarketStore';
import { useAuthStore } from '../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Layout = () => {
  const { alerts } = useMarketStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const triggeredAlerts = alerts.filter(a => a.status === 'triggered').length;
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleNotification = (e: any) => {
      setToastMessage(e.detail);
      setTimeout(() => setToastMessage(null), 5000);
    };

    window.addEventListener('alert-notification', handleNotification);
    return () => window.removeEventListener('alert-notification', handleNotification);
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Sidebar />
      <main className="flex-1 ml-[220px] flex flex-col min-h-screen overflow-x-hidden relative">
        {/* Global Glassmorphism Header */}
        <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[var(--bg-base)]/70 border-b border-[var(--border)] px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="relative group w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent-blue)] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm tài sản, cổ phiếu, tin tức..."
              className="w-full bg-[var(--bg-card)]/50 border border-[var(--border)] rounded-full py-2.5 pl-12 pr-6 focus:outline-none focus:border-[var(--accent-blue)] transition-all text-sm backdrop-blur-md"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-[var(--text-muted)] hover:text-white">
              <Bell size={20} />
              {triggeredAlerts > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[var(--red)] rounded-full animate-pulse shadow-[0_0_8px_var(--red)]" />
              )}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              {user ? (
                <Link to="/profile" className="flex items-center gap-3 hover:opacity-85 transition-opacity duration-200" title="Xem trang cá nhân">
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{user.email.split('@')[0]}</div>
                    <div className="text-[10px] uppercase font-black tracking-widest text-[var(--green)]">
                      {user.role}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[var(--accent-blue)] to-[var(--accent-cyan)] flex items-center justify-center font-black text-white shadow-lg text-lg border border-white/10">
                    {user.email[0].toUpperCase()}
                  </div>
                </Link>
              ) : (
                <>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">Guest</div>
                    <div className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">
                      Observer
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-black text-[var(--text-muted)] text-lg">
                    G
                  </div>
                </>
              )}
              {user ? (
                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  className="ml-2 p-2 rounded-full hover:bg-white/5 transition-colors text-[var(--text-muted)] hover:text-red-400"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              ) : (
                <Link 
                  to="/login"
                  className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-blue)]/20 hover:bg-[var(--accent-blue)]/40 text-[var(--accent-blue)] transition-colors text-xs font-bold uppercase tracking-wider"
                >
                  <LogIn size={14} />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Ticker Tape */}
        <TickerTape />

        {/* Global Alert Toast */}
        {toastMessage && (
          <div className="fixed top-24 right-8 z-[100] bg-[#0f1629] border border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)] rounded-2xl p-4 flex items-start gap-4 w-80 animate-fade-in-up">
            <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg shrink-0">
              <Bell size={20} className="animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-sm">Price Alert Triggered!</h4>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-gray-500 hover:text-white shrink-0">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Page Content */}
        <div className="p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
