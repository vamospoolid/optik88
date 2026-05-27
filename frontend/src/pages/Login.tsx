import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, Lock, User, Loader2 } from 'lucide-react';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { login, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    const success = await login({ username, password });
    if (success) {
      navigate('/');
    }
  };

  const displayError = localError || authError;

  return (
    <div className="login-container">
      <div className="login-card glass-card animate-fade-in">
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-icon-lg">O88</span>
          </div>
          <h2>Optik88</h2>
          <p>Masuk ke sistem manajemen optik</p>
        </div>
        
        {displayError && <div className="login-error">{displayError}</div>}
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                className="form-control" 
                placeholder="owner / admin / kasir"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                className="form-control" 
                placeholder="password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                Memproses <Loader2 size={18} className="animate-spin" />
              </>
            ) : (
              <>
                Masuk <Eye size={18} />
              </>
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Sistem Optik PWA &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
