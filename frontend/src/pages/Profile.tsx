import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { useAlertStore } from '../store/useAlertStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, 
  Mail, 
  Shield, 
  Key, 
  Copy, 
  Check, 
  LogOut, 
  List, 
  Bell, 
  Database, 
  Server, 
  Globe,
  Wallet,
  Plus
} from 'lucide-react';

interface RegistryUser {
  id: number;
  email: string;
  role: string;
  createdAt: string;
}

const API_URL = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const Profile = () => {
  const { user, token, logout, updateBalance } = useAuthStore();
  const { items: watchlistItems, fetchWatchlist } = useWatchlistStore();
  const { items: alertItems, fetchAlerts } = useAlertStore();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);
  const [registryUsers, setRegistryUsers] = useState<RegistryUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  
  // Wallet/Deposit states
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWatchlist();
      fetchAlerts();
    }
  }, [user, fetchWatchlist, fetchAlerts]);

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      return;
    }

    const fetchRegistryUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await axios.get<RegistryUser[]>(
          `${API_URL}/api/auth/users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRegistryUsers(response.data);
        setUsersError(null);
      } catch (err: any) {
        console.error('Failed to fetch registry users:', err);
        setUsersError(err.message || 'Failed to fetch users');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchRegistryUsers();
  }, [token, user]);

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeposit = async () => {
    try {
      setDepositError(null);
      setDepositSuccess(false);
      
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) {
        setDepositError('Vui lòng nhập số tiền hợp lệ');
        return;
      }

      setIsDepositing(true);
      
      const response = await axios.post(
        `${API_URL}/api/auth/deposit`,
        { amount },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update store with new balance
      if (response.data.user) {
        updateBalance(response.data.user.balance);
        setDepositSuccess(true);
        setDepositAmount('');
        
        // Clear success message after 3 seconds
        setTimeout(() => setDepositSuccess(false), 3000);
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      setDepositError(error.response?.data?.error || 'Lỗi khi nạp tiền. Vui lòng thử lại.');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleQuickDeposit = (amount: number) => {
    setDepositAmount(amount.toString());
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[var(--text-muted)]">
        <User size={48} className="animate-bounce mb-4 text-[var(--accent-blue)]" />
        <p className="text-lg font-bold">Vui lòng đăng nhập để xem thông tin tài khoản.</p>
        <button 
          onClick={() => navigate('/login')} 
          className="mt-4 px-6 py-2.5 rounded-full bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/80 text-white font-black uppercase tracking-wider text-xs transition-all shadow-lg"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  // ADMIN VIEW
  if (user?.role === 'admin') {
    return (
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-black text-white">
            Thông tin <span className="text-[var(--accent-blue)]">Tài khoản</span>
          </h1>
          <p className="text-[var(--text-muted)] mt-2 font-medium">
            Admin Panel - Xem thông tin lưu trữ phiên đăng nhập, chi tiết bảo mật và quản lý hệ thống.
          </p>
        </div>

        {/* Wallet Card */}
        <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--accent-blue)]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[var(--accent-cyan)]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] rounded-xl">
                  <Wallet size={24} className="text-white" />
                </div>
                Ví điện tử
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Balance Display */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 lg:col-span-2">
                <p className="text-[var(--text-muted)] text-xs uppercase font-black tracking-wider mb-2">Số dư hiện tại</p>
                <p className="text-5xl font-black bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] bg-clip-text text-transparent mb-6">
                  {(user?.balance ?? 0).toLocaleString('vi-VN')}₫
                </p>

                {/* Deposit Form */}
                <div className="space-y-3">
                  {depositError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {depositError}
                    </div>
                  )}
                  {depositSuccess && (
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                      <Check size={16} />
                      Nạp tiền thành công!
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Nhập số tiền"
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]/50 transition-colors"
                    />
                    <button
                      onClick={handleDeposit}
                      disabled={isDepositing}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] hover:shadow-lg hover:shadow-[var(--accent-blue)]/30 text-white font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isDepositing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                          Đang xử lý
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          Nạp tiền
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Deposit Buttons */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                <p className="text-[var(--text-muted)] text-xs uppercase font-black tracking-wider mb-4">Nạp nhanh</p>
                <div className="space-y-2">
                  {[50000, 100000, 200000, 500000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickDeposit(amount)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/5 hover:border-[var(--accent-blue)]/30 text-white text-sm font-bold transition-all group"
                    >
                      <span className="group-hover:text-[var(--accent-blue)] transition-colors">
                        +{amount.toLocaleString('vi-VN')}₫
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Basic Info */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
              {/* Background Decorative Blur */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent-blue)]/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[var(--accent-cyan)]/15 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />

              <div className="relative">
                <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-black text-white shadow-xl text-4xl mb-6 relative z-10 border border-white/10">
                  {user.email[0].toUpperCase()}
                </div>
                <span className="absolute bottom-6 right-2 w-6 h-6 bg-green-500 border-4 border-[#0f172a] rounded-full z-20 animate-pulse" />
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight">{user.email.split('@')[0]}</h2>
              <p className="text-[var(--text-muted)] text-sm mt-1">{user.email}</p>

              <span className="mt-4 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-widest">
                👑 {user.role}
              </span>

              <button 
                onClick={handleLogout}
                className="mt-8 w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 py-3 rounded-2xl font-bold transition-all duration-200"
              >
                <LogOut size={18} />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
                <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded-xl">
                  <List size={20} />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{watchlistItems.length}</div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-wider">Theo dõi</div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
                <div className="p-3 bg-orange-500/10 text-orange-400 border border-orange-500/10 rounded-xl">
                  <Bell size={20} />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{alertItems.length}</div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-wider">Cảnh báo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Storage & Verification Details - ADMIN ONLY */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* User storage information */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <h3 className="text-xl font-black text-white flex items-center gap-3 mb-6">
                <Database size={20} className="text-[var(--accent-blue)]" />
                Chi tiết Đối chiếu Trình duyệt (Browser Auth Storage)
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User ID Card */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-start gap-4">
                    <div className="p-3 bg-white/5 text-[var(--text-muted)] rounded-xl mt-1">
                      <User size={18} />
                    </div>
                    <div>
                      <h4 className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-wider">User ID (Cơ sở dữ liệu)</h4>
                      <p className="text-white font-black text-lg mt-1">{user.id}</p>
                    </div>
                  </div>

                  {/* Email Card */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-start gap-4">
                    <div className="p-3 bg-white/5 text-[var(--text-muted)] rounded-xl mt-1">
                      <Mail size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-wider">Email liên kết</h4>
                      <p className="text-white font-bold text-base mt-1 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Role Card */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-start gap-4">
                    <div className="p-3 bg-white/5 text-[var(--text-muted)] rounded-xl mt-1">
                      <Shield size={18} />
                    </div>
                    <div>
                      <h4 className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-wider">Vai trò hệ thống</h4>
                      <p className="text-purple-400 font-black text-lg mt-1 uppercase tracking-widest">{user.role}</p>
                    </div>
                  </div>

                  {/* Auth Method Card */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-start gap-4">
                    <div className="p-3 bg-white/5 text-[var(--text-muted)] rounded-xl mt-1">
                      <Key size={18} />
                    </div>
                    <div>
                      <h4 className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-wider">Phương thức đối chiếu</h4>
                      <p className="text-[var(--accent-cyan)] font-black text-base mt-1">JSON Web Token (JWT)</p>
                    </div>
                  </div>
                </div>

                {/* JWT Token display card */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Server size={18} className="text-[var(--accent-blue)]" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Raw JWT Authorization Token</h4>
                    </div>
                    
                    <button 
                      onClick={handleCopyToken}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[var(--text-muted)] hover:text-white transition-all border border-white/5"
                      title="Copy token to clipboard"
                    >
                      {copied ? (
                        <>
                          <Check size={14} className="text-green-400" />
                          <span className="text-green-400">Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-xs text-blue-400/80 break-all select-all max-h-32 overflow-y-auto leading-relaxed">
                    {token}
                  </div>
                  
                  <p className="text-[10px] text-[var(--text-muted)] leading-normal flex items-start gap-2">
                    <Globe size={12} className="shrink-0 mt-0.5 text-blue-500" />
                    <span>Token này được lưu tự động trong <strong>localStorage.token</strong> của trình duyệt. Mỗi yêu cầu HTTP gửi đến server để xem dữ liệu cá nhân (như Watchlist, Alert, Portfolio) sẽ gửi đính kèm mã này trong header <code>Authorization: Bearer &lt;token&gt;</code> để đối chiếu định danh.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Database Registry - ADMIN ONLY */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-[var(--accent-blue)]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[var(--accent-cyan)]/10 rounded-full blur-3xl pointer-events-none" />

          <h3 className="text-xl font-black text-white flex items-center gap-3 mb-6 relative z-10">
            <Database size={20} className="text-[var(--accent-blue)]" />
            User Database (JSON Registry)
          </h3>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-12 text-[var(--text-muted)]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--accent-blue)] mr-3"></div>
              <span>Đang tải danh sách người dùng...</span>
            </div>
          ) : usersError ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {usersError}
            </div>
          ) : registryUsers.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              Không có người dùng nào được đăng ký.
            </div>
          ) : (
            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">Email Address</th>
                    <th className="py-4 px-6">System Role</th>
                    <th className="py-4 px-6">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {registryUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 px-6 font-mono text-slate-400 group-hover:text-white transition-colors">
                        #{u.id}
                      </td>
                      <td className="py-4 px-6 font-semibold text-white">
                        {u.email}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          u.role === 'admin'
                            ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                            : 'bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-[var(--accent-blue)]'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 group-hover:text-white transition-colors">
                        {new Date(u.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // REGULAR USER VIEW
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-white">
          Thông tin <span className="text-[var(--accent-blue)]">Tài khoản</span>
        </h1>
        <p className="text-[var(--text-muted)] mt-2 font-medium">
          Xem và quản lý thông tin tài khoản cá nhân của bạn.
        </p>
      </div>

      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--accent-blue)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[var(--accent-cyan)]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] rounded-xl">
                <Wallet size={24} className="text-white" />
              </div>
              Ví điện tử
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Balance Display */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 lg:col-span-2">
              <p className="text-[var(--text-muted)] text-xs uppercase font-black tracking-wider mb-2">Số dư hiện tại</p>
              <p className="text-5xl font-black bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] bg-clip-text text-transparent mb-6">
                {(user?.balance ?? 0).toLocaleString('vi-VN')}₫
              </p>

              {/* Deposit Form */}
              <div className="space-y-3">
                {depositError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {depositError}
                  </div>
                )}
                {depositSuccess && (
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                    <Check size={16} />
                    Nạp tiền thành công!
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Nhập số tiền"
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]/50 transition-colors"
                  />
                  <button
                    onClick={handleDeposit}
                    disabled={isDepositing}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] hover:shadow-lg hover:shadow-[var(--accent-blue)]/30 text-white font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isDepositing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                        Đang xử lý
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Nạp tiền
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Deposit Buttons */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <p className="text-[var(--text-muted)] text-xs uppercase font-black tracking-wider mb-4">Nạp nhanh</p>
              <div className="space-y-2">
                {[50000, 100000, 200000, 500000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickDeposit(amount)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/5 hover:border-[var(--accent-blue)]/30 text-white text-sm font-bold transition-all group"
                  >
                    <span className="group-hover:text-[var(--accent-blue)] transition-colors">
                      +{amount.toLocaleString('vi-VN')}₫
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card - Centered for Regular Users */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
            {/* Background Decorative Blur */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent-blue)]/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[var(--accent-cyan)]/15 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />

            <div className="relative">
              <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-[var(--accent-blue)] to-[var(--accent-cyan)] flex items-center justify-center font-black text-white shadow-xl text-4xl mb-6 relative z-10 border border-white/10">
                {user.email[0].toUpperCase()}
              </div>
              <span className="absolute bottom-6 right-2 w-6 h-6 bg-green-500 border-4 border-[#0f172a] rounded-full z-20 animate-pulse" />
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">{user.email.split('@')[0]}</h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">{user.email}</p>

            <span className="mt-4 px-4 py-1.5 rounded-full bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-[var(--accent-blue)] text-xs font-black uppercase tracking-widest">
              {user.role}
            </span>

            <button 
              onClick={handleLogout}
              className="mt-8 w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 py-3 rounded-2xl font-bold transition-all duration-200"
            >
              <LogOut size={18} />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
              <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded-xl">
                <List size={20} />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{watchlistItems.length}</div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-wider">Theo dõi</div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
              <div className="p-3 bg-orange-500/10 text-orange-400 border border-orange-500/10 rounded-xl">
                <Bell size={20} />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{alertItems.length}</div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-wider">Cảnh báo</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message for Regular Users */}
      <div className="bg-gradient-to-br from-white/5 to-transparent backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-[var(--accent-blue)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[var(--accent-cyan)]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h3 className="text-xl font-black text-white mb-4">Welcome to Market Monitor</h3>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            You have access to all the essential features including <span className="text-[var(--accent-blue)] font-bold">Portfolio Management</span>, 
            <span className="text-[var(--accent-blue)] font-bold"> Asset Tracking</span>, and <span className="text-[var(--accent-blue)] font-bold">Price Alerts</span>. 
            Navigate using the sidebar to explore all available tools and monitor your investments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
