import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { authService } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export default function Login() {
  const navigate    = useNavigate();
  const loginStore  = useAuthStore(s => s.login);

  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');
  const [mounted,   setMounted]   = useState(false);
  const [online,    setOnline]    = useState(navigator.onLine);
  const [focusField, setFocusField] = useState<'user'|'pass'|null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    const handleOnline  = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearTimeout(t);
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setIsLoading(true);
    setError('');
    try {
      const response: any = await authService.login(username, password);
      loginStore(response.user, response.accessToken || response.token);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Koneksi timeout. Server tidak merespons.');
      } else if (err.response?.status === 401) {
        setError('Username atau password salah.');
      } else {
        setError(`${err.response?.data?.message || err.message || 'Terjadi kesalahan tidak diketahui.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* Ambient animated background */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
        <div className="login-bg-grid" />
      </div>

      {/* Status bar area */}
      <div className="login-status-bar">
        <div className={`login-net-pill ${online ? 'login-net-online' : 'login-net-offline'}`}>
          {online ? <Wifi size={10} /> : <WifiOff size={10} />}
          {online ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Main scroll area */}
      <div className={`login-scroll ${mounted ? 'login-scroll-in' : ''}`}>

        {/* ── Hero Section ── */}
        <div className="login-hero">
          {/* Lens rings */}
          <div className="login-lens-wrap">
            <div className="login-lens-ring login-lens-ring-1" />
            <div className="login-lens-ring login-lens-ring-2" />
            <div className="login-logo-box">
              <div className="login-logo-inner">88</div>
            </div>
          </div>

          <div className="login-hero-text">
            <h1 className="login-title">Optik<span className="login-title-accent">88</span></h1>
            <p className="login-subtitle">Sistem POS & Rekam Medis Klinis</p>
          </div>

          <div className="login-hero-badge">
            <ShieldCheck size={11} />
            <span>Secure Access</span>
          </div>
        </div>

        {/* ── Login Card ── */}
        <div className="login-card-wrap">
          <div className="login-card">

            {/* Card header */}
            <div className="login-card-header">
              <h2 className="login-card-title">Selamat Datang</h2>
              <p className="login-card-desc">Masuk ke akun Optik88 Anda</p>
            </div>

            {/* Error alert */}
            {error && (
              <div className="login-error-box">
                <span className="login-error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-form">

              {/* Username */}
              <div className={`login-field ${focusField === 'user' ? 'login-field-active' : ''}`}>
                <label className="login-field-label">Username</label>
                <div className="login-field-wrap">
                  <div className="login-field-icon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    className="login-input"
                    placeholder="Owner / Admin / Kasir"
                    value={username}
                    onChange={e => setUsername(e.target.value.trim())}
                    onFocus={() => setFocusField('user')}
                    onBlur={() => setFocusField(null)}
                    disabled={isLoading}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className={`login-field ${focusField === 'pass' ? 'login-field-active' : ''}`}>
                <label className="login-field-label">Password</label>
                <div className="login-field-wrap">
                  <div className="login-field-icon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    className="login-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusField('pass')}
                    onBlur={() => setFocusField(null)}
                    disabled={isLoading}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPass(v => !v)}
                    tabIndex={-1}
                    aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                className={`login-btn ${isLoading ? 'login-btn-loading' : ''}`}
                disabled={isLoading || !username || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="login-spin-icon" />
                    <span>Menghubungkan...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10 17 15 12 10 7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    <span>Masuk Sekarang</span>
                  </>
                )}
              </button>
            </form>

            {/* Role chips */}
            <div className="login-roles">
              <span className="login-roles-label">Akses tersedia:</span>
              <div className="login-roles-chips">
                {['Owner', 'Admin', 'Kasir'].map(r => (
                  <span key={r} className="login-role-chip">{r}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>Optik88 v2.0 &nbsp;•&nbsp; Mobile PWA</p>
          <p>© 2025 Codenusa. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
