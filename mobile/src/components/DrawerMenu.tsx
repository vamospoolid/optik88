import { useNavigate } from 'react-router-dom';
import { BookOpen, BarChart3, Settings, Receipt, X } from 'lucide-react';

interface DrawerMenuProps {
  onClose: () => void;
}

export default function DrawerMenu({ onClose }: DrawerMenuProps) {
  const navigate = useNavigate();

  const menuItems = [
    { icon: Receipt, label: 'Transaksi', path: '/transaksi' },
    { icon: BookOpen, label: 'Buku Kas', path: '/kas' },
    { icon: BarChart3, label: 'Laporan', path: '/laporan' },
    { icon: Settings, label: 'Pengaturan', path: '/pengaturan' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet animate-slide-up" style={{ borderRadius: '28px 28px 0 0' }}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <span className="sheet-title">Menu Lainnya</span>
          <button className="sheet-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="sheet-body" style={{ paddingBottom: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  className="quick-btn ripple"
                  style={{ width: '100%', height: '110px', justifyContent: 'center' }}
                  onClick={() => handleNavigate(item.path)}
                >
                  <div className="quick-btn-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    <Icon size={24} />
                  </div>
                  <span className="quick-btn-label" style={{ marginTop: '0.5rem', fontWeight: 600 }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
