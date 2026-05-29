import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Loader2, Sparkles } from 'lucide-react';
import { authService } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export default function Login() {
  const navigate = useNavigate();
  const loginStore = useAuthStore(s => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        setError(`Error: ${err.response?.data?.message || err.message || 'Terjadi kesalahan tidak diketahui.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-scroll animate-fade-in" style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>
      {/* Top Banner Gradient */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
        padding: '3rem 2rem 4rem 2rem',
        borderBottomLeftRadius: '40px',
        borderBottomRightRadius: '40px',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 8px 30px rgba(43, 53, 232, 0.2)'
      }}>
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Sparkles size={12} />
          MOBILE PWA
        </div>

        <div style={{
          width: '72px',
          height: '72px',
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '1.5rem auto 1rem auto',
          fontSize: '2rem',
          fontWeight: 800,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
        }}>
          88
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Optik88 POS</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 500 }}>
          Sistem POS & Rekam Medis Klinis
        </p>
      </div>

      {/* Login Card Form */}
      <div style={{ padding: '0 1.5rem', marginTop: '-2rem', flex: 1, zIndex: 10 }}>
        <form onSubmit={handleSubmit} className="card animate-slide-in" style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid rgba(43, 53, 232, 0.05)', boxShadow: 'var(--shadow-lg)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '0.5rem' }}>
            Masuk Ke Akun Anda
          </h2>

          {error && (
            <div className="badge badge-red" style={{ padding: '0.75rem 1rem', borderRadius: '12px', width: '100%', whiteSpace: 'normal', lineHeight: '1.4' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Owner / Admin / Kasir"
                value={username}
                onChange={e => setUsername(e.target.value.trim())}
                disabled={isLoading}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full ripple"
            style={{ marginTop: '0.75rem', height: '48px', borderRadius: 'var(--radius-md)' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Menghubungkan...
              </>
            ) : (
              'Masuk Sekarang'
            )}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>
        Optik88 v2.0 • Made with ❤️ for Mobile PWA
      </div>
    </div>
  );
}
