import { useState } from 'react';
import {
  Printer, MessageSquare, ChevronRight, Lock, LogOut,
  ToggleLeft, ToggleRight, X, Store, Phone, Mail,
  Instagram, MapPin, Bluetooth, BluetoothConnected, QrCode, Edit3, Check
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';

/* ─── Bluetooth scan (Web Bluetooth API) ─── */
async function scanBluetooth(): Promise<{ name: string } | null> {
  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
    });
    return { name: device.name || 'Unknown Device' };
  } catch {
    return null;
  }
}

export default function Settings() {
  const user   = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const {
    venue, setVenue,
    waNumber, setWaNumber,
    gdrivePrescriptionUrl, setGdrivePrescriptionUrl,
    btPrinterName, btPrinterConnected, setBtPrinter,
  } = useSettingsStore();

  /* Modal state */
  const [showVenueModal, setShowVenueModal]   = useState(false);
  const [showWaModal,    setShowWaModal]       = useState(false);
  const [showBtModal,    setShowBtModal]       = useState(false);
  const [showDriveModal, setShowDriveModal]    = useState(false);

  /* Venue draft */
  const [venueDraft, setVenueDraft] = useState({ ...venue });

  /* WA draft */
  const [waDraft, setWaDraft] = useState(waNumber);

  /* BT scan state */
  const [btScanning, setBtScanning] = useState(false);
  const [btError,    setBtError]    = useState('');

  /* Drive draft */
  const [driveDraft, setDriveDraft] = useState(gdrivePrescriptionUrl);

  /* Venue save */
  const saveVenue = () => { setVenue(venueDraft); setShowVenueModal(false); };

  /* WA save */
  const saveWa = () => { setWaNumber(waDraft); setShowWaModal(false); };

  /* BT scan */
  const handleBtScan = async () => {
    setBtError('');
    setBtScanning(true);
    const dev = await scanBluetooth();
    setBtScanning(false);
    if (dev) {
      setBtPrinter(dev.name, true);
    } else {
      setBtError('Perangkat tidak ditemukan atau akses ditolak.');
    }
  };

  /* Drive save */
  const saveDrive = () => { setGdrivePrescriptionUrl(driveDraft); setShowDriveModal(false); };

  /* WhatsApp test message */
  const testWaLink = () => {
    const num = waNumber.replace(/\D/g, '');
    if (!num) return;
    window.open(`https://wa.me/${num}?text=Halo%2C%20ini%20test%20dari%20Optik88%20✅`, '_blank');
  };

  return (
    <div className="page-scroll animate-fade-in" style={{ paddingBottom: '6rem' }}>

      {/* ── Top Bar ── */}
      <div className="top-bar">
        <span className="top-bar-title">Pengaturan</span>
        <div style={{ width: 38 }} />
      </div>

      {/* ── User Card ── */}
      <div className="card" style={{ margin: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--primary)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.25rem', fontWeight: 800,
        }}>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>{user?.name || 'Staff'}</div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
            Role: <strong style={{ textTransform: 'uppercase', color: 'var(--primary)' }}>{user?.role || 'kasir'}</strong>
          </span>
        </div>
      </div>

      {/* ══════════ SECTION: VENUE ══════════ */}
      <div className="section-header">
        <span className="section-title">Profil Toko</span>
      </div>

      <div style={{ padding: '0 1rem' }}>
        <div className="card ripple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => { setVenueDraft({ ...venue }); setShowVenueModal(true); }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{venue.namaOptik || 'Optik88'}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {venue.alamat ? venue.alamat.slice(0, 32) + (venue.alamat.length > 32 ? '…' : '') : 'Tap untuk isi data toko'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-secondary" />
        </div>
      </div>

      {/* ══════════ SECTION: KONEKSI ══════════ */}
      <div className="section-header" style={{ marginTop: '1rem' }}>
        <span className="section-title">Koneksi & Integrasi</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 1rem' }}>

        {/* WhatsApp */}
        <div className="card ripple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => { setWaDraft(waNumber); setShowWaModal(true); }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>WhatsApp Bisnis</div>
              <span style={{ fontSize: '0.75rem', color: waNumber ? '#059669' : 'var(--text-secondary)', fontWeight: waNumber ? 600 : 400 }}>
                {waNumber ? `🟢 +${waNumber.replace(/\D/g, '')}` : '🔴 Belum diatur'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-secondary" />
        </div>

        {/* Bluetooth Printer */}
        <div className="card ripple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setShowBtModal(true)}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {btPrinterConnected ? <BluetoothConnected size={20} /> : <Printer size={20} />}
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Printer Bluetooth Thermal</div>
              <span style={{ fontSize: '0.75rem', color: btPrinterConnected ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: btPrinterConnected ? 600 : 400 }}>
                {btPrinterConnected ? `🟢 ${btPrinterName}` : '🔴 Belum terhubung'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-secondary" />
        </div>

        {/* Google Drive */}
        <div className="card ripple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => { setDriveDraft(gdrivePrescriptionUrl); setShowDriveModal(true); }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Penyimpanan G-Drive</div>
              <span style={{ fontSize: '0.75rem', color: gdrivePrescriptionUrl ? '#0284C7' : 'var(--text-secondary)' }}>
                {gdrivePrescriptionUrl ? '🟢 Link tersimpan' : 'Belum ada link folder'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-secondary" />
        </div>
      </div>

      {/* ══════════ SECTION: KEAMANAN ══════════ */}
      <div className="section-header" style={{ marginTop: '1rem' }}>
        <span className="section-title">Keamanan</span>
      </div>
      <div style={{ padding: '0 1rem' }}>
        <div className="card ripple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => alert('Ganti Password dapat dilakukan di menu desktop admin.')}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      {/* ══════════ LOGOUT ══════════ */}
      <div style={{ padding: '2rem 1rem 1rem' }}>
        <button type="button" className="btn btn-danger btn-full ripple"
          style={{ height: 48, gap: 6, color: 'var(--danger)', background: 'var(--danger-light)' }}
          onClick={logout}>
          <LogOut size={16} />
          <span>Keluar Dari Sistem</span>
        </button>
      </div>

      {/* ══════════ MODAL: VENUE ══════════ */}
      {showVenueModal && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowVenueModal(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <span className="sheet-title">Profil Toko</span>
              <button className="sheet-close" onClick={() => setShowVenueModal(false)}><X size={18} /></button>
            </div>
            <div className="sheet-body">

              {[
                { icon: <Store size={16} />, label: 'Nama Toko', key: 'namaOptik', placeholder: 'Optik88', type: 'text' },
                { icon: <MapPin size={16} />, label: 'Alamat', key: 'alamat', placeholder: 'Jl. Contoh No.1, Kota', type: 'text' },
                { icon: <Phone size={16} />, label: 'Telepon', key: 'telepon', placeholder: '021-xxxx', type: 'tel' },
                { icon: <MessageSquare size={16} />, label: 'WhatsApp Toko', key: 'whatsapp', placeholder: '628xxxxxxxxxx', type: 'tel' },
                { icon: <Mail size={16} />, label: 'Email', key: 'email', placeholder: 'optik@email.com', type: 'email' },
                { icon: <Instagram size={16} />, label: 'Instagram', key: 'instagram', placeholder: '@optik88', type: 'text' },
                { icon: <Edit3 size={16} />, label: 'Tagline', key: 'tagline', placeholder: 'Solusi Kacamata Terbaik', type: 'text' },
              ].map(({ icon, label, key, placeholder, type }) => (
                <div key={key} className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {icon} {label}
                  </label>
                  <input
                    type={type}
                    className="form-control"
                    placeholder={placeholder}
                    value={(venueDraft as any)[key]}
                    onChange={e => setVenueDraft(d => ({ ...d, [key]: e.target.value }))}
                  />
                </div>
              ))}

              <button type="button" className="btn btn-primary btn-full ripple" style={{ marginTop: '0.5rem' }} onClick={saveVenue}>
                <Check size={16} /> Simpan Data Toko
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════ MODAL: WHATSAPP ══════════ */}
      {showWaModal && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowWaModal(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <span className="sheet-title">WhatsApp Bisnis</span>
              <button className="sheet-close" onClick={() => setShowWaModal(false)}><X size={18} /></button>
            </div>
            <div className="sheet-body">

              {/* QR Visual */}
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{
                  width: 140, height: 140, margin: '0 auto 0.75rem',
                  background: '#F8FAFF', borderRadius: 16,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  border: '2px dashed var(--border)', gap: '0.5rem',
                }}>
                  <QrCode size={48} color="var(--primary)" />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>QR Kode WA</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Scan QR di atas dari aplikasi WhatsApp Business untuk menghubungkan notifikasi otomatis.
                </p>
              </div>

              {/* Manual number input */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Phone size={14} /> Nomor WhatsApp Bisnis
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>+</span>
                  <input
                    type="tel"
                    className="form-control"
                    style={{ paddingLeft: '1.75rem' }}
                    placeholder="628xxxxxxxxxx"
                    value={waDraft}
                    onChange={e => setWaDraft(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  Format: 628xxx (tanpa +, tanpa spasi)
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary ripple" style={{ flex: 1 }} onClick={testWaLink} disabled={!waDraft}>
                  🔗 Test Link
                </button>
                <button type="button" className="btn btn-primary ripple" style={{ flex: 1 }} onClick={saveWa}>
                  <Check size={16} /> Simpan
                </button>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '0.5rem', textAlign: 'center' }}>
                Digunakan untuk notifikasi selesai pesanan, pengingat kontrol 6 bulan, dan ucapan ulang tahun pasien.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ══════════ MODAL: BLUETOOTH PRINTER ══════════ */}
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

              {/* Status */}
              <div style={{
                background: btPrinterConnected ? 'var(--success-light)' : 'var(--primary-light)',
                borderRadius: 16, padding: '1rem', textAlign: 'center', marginBottom: '0.5rem',
              }}>
                {btPrinterConnected
                  ? <BluetoothConnected size={36} color="var(--success)" />
                  : <Bluetooth size={36} color="var(--primary)" />}
                <div style={{ fontWeight: 700, marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  {btPrinterConnected ? btPrinterName : 'Belum ada printer'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {btPrinterConnected ? '🟢 Terhubung & siap cetak' : 'Tap Scan untuk cari printer'}
                </div>
              </div>

              {btError && (
                <div className="badge badge-red" style={{ padding: '0.625rem 1rem', borderRadius: 12, width: '100%', whiteSpace: 'normal', marginBottom: '0.5rem' }}>
                  ⚠️ {btError}
                </div>
              )}

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Pastikan printer thermal 58mm Anda sudah dalam mode <strong>pairing</strong> dan Bluetooth HP aktif.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-full ripple"
                  disabled={btScanning}
                  onClick={handleBtScan}
                >
                  {btScanning
                    ? <><span className="animate-spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Scanning...</>
                    : <><Bluetooth size={16} /> Scan Printer</>}
                </button>
                {btPrinterConnected && (
                  <button type="button" className="btn btn-secondary ripple" onClick={() => setBtPrinter('', false)}>
                    Putuskan
                  </button>
                )}
              </div>

              {btPrinterConnected && (
                <button type="button" className="btn btn-secondary btn-full ripple" style={{ marginTop: '0.5rem' }}
                  onClick={() => alert('Mengirim test print...')}>
                  🖨️ Cetak Test Invoice
                </button>
              )}

              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.375rem' }}>Printer yang didukung:</div>
                {['RPP02N (58mm)', 'PeriPage A6', 'Goojprt PT-210', 'Gprinter GP-2120TF'].map(p => (
                  <div key={p} style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', padding: '2px 0' }}>• {p}</div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════ MODAL: GOOGLE DRIVE ══════════ */}
      {showDriveModal && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowDriveModal(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <span className="sheet-title">Penyimpanan G-Drive</span>
              <button className="sheet-close" onClick={() => setShowDriveModal(false)}><X size={18} /></button>
            </div>
            <div className="sheet-body">
              <div className="form-group">
                <label className="form-label">Link Folder Google Drive</label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={driveDraft}
                  onChange={e => setDriveDraft(e.target.value)}
                />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  Folder untuk menyimpan foto resep & berkas pasien
                </span>
              </div>
              {driveDraft && (
                <a href={driveDraft} target="_blank" rel="noreferrer"
                  style={{ display: 'block', fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                  🔗 Buka folder di Google Drive
                </a>
              )}
              <button type="button" className="btn btn-primary btn-full ripple" onClick={saveDrive}>
                <Check size={16} /> Simpan Link
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
