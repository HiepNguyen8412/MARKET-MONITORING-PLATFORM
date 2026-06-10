import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { AlertCircle } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      
      setAuth(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1a1f3a] to-[#0f172a] text-white p-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-[500px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black mb-2 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] bg-clip-text text-transparent">
            Tạo tài khoản
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Tham gia Market Monitor ngay hôm nay
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 flex items-center gap-2 text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Email</label>
            <input
              type="email"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]/50 focus:bg-white/5 transition-all min-h-[44px]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Mật khẩu</label>
            <input
              type="password"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]/50 focus:bg-white/5 transition-all min-h-[44px]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-cyan)] hover:shadow-lg hover:shadow-[var(--accent-blue)]/30 text-white font-black py-3 rounded-xl transition-all uppercase tracking-wider text-sm min-h-[44px] mt-4">
            Đăng ký
          </button>
        </form>
        
        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-[var(--accent-blue)] hover:text-[var(--accent-cyan)] font-bold transition-colors min-h-[44px] inline-flex items-center">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
