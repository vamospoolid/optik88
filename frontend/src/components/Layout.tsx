import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, ShoppingBag, Package, LogOut, BarChart2, Wallet, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'owner'] },
    { path: '/pasien', label: 'Pasien', icon: <Users size={20} />, roles: ['admin', 'kasir', 'optometris'] },
    { path: '/periksa', label: 'Periksa', icon: <Activity size={20} />, roles: ['admin', 'optometris'] },
    { path: '/transaksi', label: 'Transaksi', icon: <ShoppingBag size={20} />, roles: ['admin', 'kasir'] },
    { path: '/kas', label: 'Kas', icon: <Wallet size={20} />, roles: ['admin', 'kasir', 'owner'] },
    { path: '/stok', label: 'Stok', icon: <Package size={20} />, roles: ['admin'] },
    { path: '/laporan', label: 'Laporan', icon: <BarChart2 size={20} />, roles: ['admin', 'owner'] },
    { path: '/pengaturan', label: 'Pengaturan', icon: <SettingsIcon size={20} />, roles: ['admin', 'owner'] },
  ];

  // Filter items based on user role
  const navItems = allNavItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="layout-wrapper">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-placeholder">
            <span className="logo-icon">O88</span>
            <h2>Optik88</h2>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">{user?.name.charAt(0) || 'U'}</div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role" style={{ textTransform: 'capitalize' }}>
                {user?.role || 'Guest'}
              </span>
            </div>
            <button className="btn-icon" onClick={handleLogout} title="Keluar">
              <LogOut size={18} className="text-secondary" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content animate-fade-in">
        <header className="mobile-header">
          <h2>Optik88</h2>
          <div className="d-flex align-items-center" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             <button className="btn-icon" onClick={handleLogout} title="Keluar">
                <LogOut size={18} />
             </button>
             <div className="avatar sm">{user?.name.charAt(0) || 'U'}</div>
          </div>
        </header>
        <div className="content-container">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
