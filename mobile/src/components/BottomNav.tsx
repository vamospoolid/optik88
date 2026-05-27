import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, ShoppingCart, Package, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import DrawerMenu from './DrawerMenu';

const navItems = [
  { icon: Home,    label: 'Beranda',  path: '/' },
  { icon: Users,   label: 'Pasien',   path: '/pasien' },
  { icon: null,    label: 'Order',    path: '/order/baru', isFab: true },
  { icon: Package, label: 'Stok',     path: '/stok' },
  { icon: MoreHorizontal, label: 'Lainnya', path: null, isDrawer: true },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav className="bottom-nav">
        {navItems.map((item, i) => {
          if (item.isFab) {
            return (
              <button key={i} className="nav-fab" onClick={() => navigate('/order/baru')} aria-label="Order Baru">
                <ShoppingCart size={22} />
              </button>
            );
          }
          if (item.isDrawer) {
            return (
              <button key={i} className="nav-item" onClick={() => setDrawerOpen(true)}>
                <div className="nav-icon-wrap"><MoreHorizontal size={20} /></div>
                <span>Lainnya</span>
              </button>
            );
          }
          const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path!);
          const Icon = item.icon!;
          return (
            <button
              key={i}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path!)}
            >
              <div className="nav-icon-wrap"><Icon size={20} /></div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      {drawerOpen && <DrawerMenu onClose={() => setDrawerOpen(false)} />}
    </>
  );
}
