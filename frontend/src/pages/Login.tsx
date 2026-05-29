import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const API_URL = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      
      setAuth(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess(false);
    setResetLoading(true);

    try {
      if (!resetEmail || !newPassword) {
        throw new Error('Email and new password are required');
      }

      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: resetEmail, 
          newPassword 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Password reset failed');

      setResetSuccess(true);
      setResetEmail('');
      setNewPassword('');
      
      // Auto-redirect to login after 2 seconds
      setTimeout(() => {
        setIsResetMode(false);
        setResetSuccess(false);
      }, 2000);
    } catch (err: any) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  // RESET PASSWORD MODE
  if (isResetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1a1f3a] to-[#0f172a] text-white p-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] bg-clip-text text-transparent">
              Đặt lại mật khẩu
            </h2>
            <p className="text-[var(--text-muted)] text-sm">
              Nhập email và mật khẩu mới của bạn
            </p>
          </div>

          {resetError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 flex items-center gap-2 text-sm">
              <AlertCircle size={18} /> {resetError}
            </div>
          )}

          {resetSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl mb-4 flex items-center gap-2 text-sm">
              ✓ Đặt lại mật khẩu thành công! Quay về đăng nhập...
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3.5 text-[var(--text-muted)]" />
                <input
                  type="email"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]/50 focus:bg-white/5 transition-all"
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3.5 text-[var(--text-muted)]" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 pl-10 pr-10 text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]/50 focus:bg-white/5 transition-all"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3.5 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] hover:shadow-lg hover:shadow-[var(--accent-blue)]/30 text-white font-black py-3 rounded-xl transition-all uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </form>

          <button
            onClick={() => {
              setIsResetMode(false);
              setResetEmail('');
              setNewPassword('');
              setResetError('');
              setResetSuccess(false);
            }}
            className="w-full mt-4 px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/5 text-white text-sm font-bold transition-all"
          >
            Quay lại Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  // LOGIN MODE
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1a1f3a] to-[#0f172a] text-white p-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] bg-clip-text text-transparent">
            Market Monitor
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Đăng nhập để tiếp tục
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 flex items-center gap-2 text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3.5 text-[var(--text-muted)]" />
              <input
                type="email"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]/50 focus:bg-white/5 transition-all"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-[var(--text-muted)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 pl-10 pr-10 text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]/50 focus:bg-white/5 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-[var(--text-muted)] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] hover:shadow-lg hover:shadow-[var(--accent-blue)]/30 text-white font-black py-3 rounded-xl transition-all uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => setIsResetMode(true)}
            className="w-full text-sm text-[var(--accent-blue)] hover:text-[var(--accent-cyan)] font-bold transition-colors"
          >
            Quên mật khẩu?
          </button>
          
          <div className="border-t border-white/10 pt-3">
            <p className="text-center text-sm text-[var(--text-muted)] mb-2">
              Chưa có tài khoản?
            </p>
            <Link
              to="/register"
              className="w-full block text-center px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/5 text-white text-sm font-bold transition-all"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
