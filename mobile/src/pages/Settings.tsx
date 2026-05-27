import { useState } from 'react';
import {
  Printer, MessageSquare, ChevronRight, Lock, LogOut, Eye, ToggleLeft, ToggleRight, X
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
export default function Settings() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  // States
  const [waConnected, setWaConnected] = useState(true);
  const [btConnected, setBtConnected] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'light' | 'blue'>('blue');
  const [gdriveEditMode, setGdriveEditMode] = useState(false);

  const { gdrivePrescriptionUrl, setGdrivePrescriptionUrl } = useSettingsStore();

  const [showWaModal, setShowWaModal] = useState(false);
  const [showBtModal, setShowBtModal] = useState(false);

  const handleTestPrint = () => {
    alert('Mengirim test print invoice ke printer Bluetooth...');
  };

  return (
    <div className="page-scroll animate-fade-in" style={{ paddingBottom: '6rem' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <span className="top-bar-title">Pengaturan</span>
        <div style={{ width: 38 }} />
      </div>

      {/* User profile header card */}
      <div className="card" style={{ margin: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'var(--primary)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.25rem', fontWeight: 800
        }}>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{user?.name || 'User Staff'}</h3>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Role: <strong style={{ textTransform: 'uppercase', color: 'var(--primary)' }}>{user?.role || 'kasir'}</strong></span>
        </div>
      </div>

      {/* Connection integration settings */}
      <div className="section-header">
        <span className="section-title">Koneksi & Integrasi</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 1rem' }}>
        {/* WhatsApp Card */}
        <div className="card ripple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowWaModal(true)}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>WhatsApp API Gateway</div>
              <span style={{ fontSize: '0.75rem', color: waConnected ? '#059669' : 'var(--text-secondary)', fontWeight: waConnected ? 600 : 400 }}>
                {waConnected ? '🟢 Terhubung' : '🔴 Terputus'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-secondary" />
        </div>

        {/* Printer Bluetooth Card */}
        <div className="card ripple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowBtModal(true)}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Printer size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Printer Bluetooth Thermal</div>
              <span style={{ fontSize: '0.75rem', color: btConnected ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: btConnected ? 600 : 400 }}>
                {btConnected ? '🟢 Terhubung (RPP02N)' : '🔴 Belum Terhubung'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-secondary" />
        </div>
      </div>

      {/* App configuration settings */}
      <div className="section-header" style={{ marginTop: '0.75rem' }}>
        <span className="section-title">Konfigurasi Aplikasi</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 1rem' }}>
        {/* Toggle Theme Option */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Tema Premium Biru</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tone warna UX Mobile aktif</span>
            </div>
          </div>
          <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary)' }} onClick={() => setActiveTheme(activeTheme === 'blue' ? 'light' : 'blue')}>
            {activeTheme === 'blue' ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </button>
        </div>

        {/* Google Drive Configuration Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Penyimpanan G-Drive</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Link folder foto resep</span>
              </div>
            </div>
            <button 
              style={{ border: 'none', background: 'var(--primary-light)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }} 
              onClick={() => setGdriveEditMode(!gdriveEditMode)}
            >
              {gdriveEditMode ? 'Simpan' : 'Edit'}
            </button>
          </div>
          {gdriveEditMode ? (
            <input 
              type="text" 
              className="input-field" 
              placeholder="Masukkan link folder Google Drive..." 
              value={gdrivePrescriptionUrl}
              onChange={(e) => setGdrivePrescriptionUrl(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            />
          ) : (
            <div style={{ fontSize: '0.8125rem', color: gdrivePrescriptionUrl ? 'var(--text)' : 'var(--text-secondary)', background: 'var(--bg)', padding: '8px', borderRadius: '6px', wordBreak: 'break-all' }}>
              {gdrivePrescriptionUrl || 'Belum ada link Google Drive yang diatur.'}
            </div>
          )}
        </div>

        {/* Change Password Card */}
        <div className="card ripple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => alert('Ganti Password dapat dilakukan di menu desktop admin.')}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Keamanan Sandi</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ubah password login</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-secondary" />
        </div>
      </div>

      {/* Logout CTA */}
      <div style={{ padding: '2rem 1rem 1rem 1rem' }}>
        <button
          type="button"
          className="btn btn-danger btn-full ripple"
          style={{ height: '48px', gap: '6px', color: 'var(--danger)', background: 'var(--danger-light)' }}
          onClick={logout}
        >
          <LogOut size={16} />
          <span>Keluar Dari Sistem</span>
        </button>
      </div>

      {/* Modal WhatsApp details */}
      {showWaModal && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowWaModal(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <span className="sheet-title">WhatsApp API Gateway</span>
              <button className="sheet-close" onClick={() => setShowWaModal(false)}><X size={18} /></button>
            </div>
            <div className="sheet-body text-center">
              <div style={{ width: '140px', height: '140px', margin: '0 auto 1rem auto', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
                {waConnected ? (
                  <div style={{ fontSize: '3rem' }}>✅</div>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Scan QR Code</span>
                )}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Koneksi aktif untuk otomatisasi notifikasi rekam klinis, nota pembayaran, dan ucapan ulang tahun bagi pasien terdaftar.
              </p>
              <button type="button" className="btn btn-secondary btn-full ripple" style={{ marginTop: '1rem' }} onClick={() => setWaConnected(!waConnected)}>
                {waConnected ? 'Putuskan WhatsApp' : 'Hubungkan WhatsApp'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal Bluetooth Printer details */}
      {showBtModal && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowBtModal(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <span className="sheet-title">Printer Bluetooth Thermal</span>
              <button className="sheet-close" onClick={() => setShowBtModal(false)}><X size={18} /></button>
            </div>
            <div className="sheet-body">
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Scan dan pasangkan printer thermal mini 58mm untuk mencetak nota kasir secara offline dari mobile.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg)', borderRadius: '8px', fontSize: '0.8125rem' }}>
                  <span>RPP02N (58mm Printer)</span>
                  <button type="button" className="btn btn-primary btn-sm" style={{ padding: '4px 8px', borderRadius: '6px' }} onClick={() => setBtConnected(!btConnected)}>
                    {btConnected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>

              {btConnected && (
                <button type="button" className="btn btn-secondary btn-full ripple" style={{ marginTop: '1rem' }} onClick={handleTestPrint}>
                  🖨️ Cetak Test Invoice
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
