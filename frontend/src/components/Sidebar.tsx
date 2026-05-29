import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Bell, Wallet, User, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuthStore } from '../store/useAuthStore';

const Sidebar = () => {
  const { user } = useAuthStore();

  // Base navigation items available to all users
  const baseNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Portfolio', path: '/portfolio', icon: Wallet },
    { name: 'Assets', path: '/assets', icon: TrendingUp },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  // Admin-only navigation items
  const adminNavItems = user?.role === 'admin' ? [
    { name: 'Admin Panel', path: '/admin', icon: Shield },
  ] : [];

  // Combine all navigation items
  const navItems = [...baseNavItems, ...adminNavItems];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col z-20">
      <div className="p-8">
        <h1 className="text-xl font-black bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] bg-clip-text text-transparent tracking-tight">
          Market Monitor
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              twMerge(
                clsx(
                  "flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]",
                  isActive && "bg-[var(--accent-blue)] text-white hover:bg-[var(--accent-blue)] hover:text-white shadow-[0_8px_20px_-8px_rgba(59,130,246,0.5)]"
                )
              )
            }
          >
            <item.icon size={20} />
            <span className="font-bold text-sm">{item.name}</span>
            {/* Admin badge for admin-only items */}
            {item.path === '/admin' && (
              <span className="ml-auto px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-300 rounded-full">
                Admin
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6">
        <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl px-4 py-3 text-center">
          <span className="text-[10px] uppercase font-black tracking-widest text-[var(--accent-blue)]">
            {user?.role === 'admin' ? '👑 Admin Mode' : 'Chế độ xem công khai'}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
