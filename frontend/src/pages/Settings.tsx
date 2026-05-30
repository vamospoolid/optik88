import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  MessageCircle,
  Printer,
  Users,
  CheckCircle,
  Smartphone,
  UserPlus,
  AlertCircle,
  Edit,
  Store,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useVenueStore, type VenueProfile } from '../store/useVenueStore';
import './Settings.css';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'venue' | 'perangkat' | 'akses'>('venue');
  const [waConnected, setWaConnected] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [saved, setSaved] = useState(false);

  const { venue, setVenue, resetVenue } = useVenueStore();
  const [form, setForm] = useState<VenueProfile>(venue);

  const handleChange = (field: keyof VenueProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setVenue(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (confirm('Reset ke data default? Semua perubahan akan hilang.')) {
      resetVenue();
      setForm(useVenueStore.getState().venue);
    }
  };

  // Mock users
  const [users] = useState([
    { id: '1', name: 'Budi (Owner)', username: 'owner', role: 'owner', status: 'aktif' },
    { id: '2', name: 'Siti (Admin)', username: 'admin', role: 'admin', status: 'aktif' },
    { id: '3', name: 'Andi (Kasir)', username: 'kasir', role: 'kasir', status: 'aktif' },
    { id: '4', name: 'Dr. Linda (RO)', username: 'optometris', role: 'optometris', status: 'aktif' },
  ]);

  const handleConnectPrinter = async () => {
    try {
      const nav = navigator as any;
      if (!nav.bluetooth) {
        alert('Web Bluetooth API tidak didukung di browser ini. Gunakan Chrome di Android/PC.');
        return;
      }
      await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
      });
      setPrinterConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-page animate-fade-in">
      {/* Hero Header */}
      <div className="settings-hero">
        <div className="settings-hero-content">
          <div className="settings-hero-icon">
            <SettingsIcon size={28} />
          </div>
          <div>
            <h1>Pengaturan Sistem</h1>
            <p>Kelola profil optik, integrasi WhatsApp, printer struk, dan hak akses staf.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'venue' ? 'active' : ''}`}
          onClick={() => setActiveTab('venue')}
        >
          <Store size={16} /> Profil Optik
        </button>
        <button
          className={`settings-tab ${activeTab === 'perangkat' ? 'active' : ''}`}
          onClick={() => setActiveTab('perangkat')}
        >
          <Smartphone size={16} /> Integrasi &amp; Perangkat
        </button>
        <button
          className={`settings-tab ${activeTab === 'akses' ? 'active' : ''}`}
          onClick={() => setActiveTab('akses')}
        >
          <Users size={16} /> Akses Pengguna
        </button>
      </div>

      {/* Body */}
      <div className="settings-content">

        {/* ===== TAB: PROFIL OPTIK ===== */}
        {activeTab === 'venue' && (
          <div className="venue-layout">
            {/* Form Card */}
            <div className="settings-card venue-form-card">
              <div className="settings-card-header">
                <div className="settings-card-icon venue-icon">
                  <Store size={24} color="white" />
                </div>
                <div>
                  <h3 className="settings-card-title">Informasi Tempat Usaha</h3>
                  <p className="settings-card-subtitle">
                    Data ini tampil di invoice cetak, invoice digital &amp; struk thermal.
                  </p>
                </div>
              </div>

              <div className="venue-form-grid">
                {/* Nama Toko */}
                <div className="venue-field full-col">
                  <label className="venue-label">
                    <Store size={14} /> Nama Optik / Toko
                  </label>
                  <input
                    className="venue-input"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Optik 88"
                  />
                </div>

                {/* Tagline */}
                <div className="venue-field full-col">
                  <label className="venue-label">
                    <Edit size={14} /> Tagline / Slogan
                  </label>
                  <input
                    className="venue-input"
                    value={form.tagline}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                    placeholder="Solusi Kacamata Terpercaya"
                  />
                </div>

                {/* Kota */}
                <div className="venue-field">
                  <label className="venue-label">
                    <MapPin size={14} /> Kota
                  </label>
                  <input
                    className="venue-input"
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Jakarta"
                  />
                </div>

                {/* Telepon */}
                <div className="venue-field">
                  <label className="venue-label">
                    <Phone size={14} /> Telepon
                  </label>
                  <input
                    className="venue-input"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="021-888888"
                  />
                </div>

                {/* Alamat */}
                <div className="venue-field full-col">
                  <label className="venue-label">
                    <MapPin size={14} /> Alamat Lengkap
                  </label>
                  <textarea
                    className="venue-input venue-textarea"
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Jl. Raya No. 88, RT 01/RW 02, Kel. ..."
                    rows={2}
                  />
                </div>

                {/* WhatsApp Owner */}
                <div className="venue-field">
                  <label className="venue-label">
                    <MessageCircle size={14} /> No. WhatsApp (tanpa + atau 0)
                  </label>
                  <input
                    className="venue-input"
                    value={form.whatsapp}
                    onChange={(e) => handleChange('whatsapp', e.target.value)}
                    placeholder="628123456789"
                  />
                  <span className="venue-hint">Contoh: 6281234567890</span>
                </div>

                {/* Email */}
                <div className="venue-field">
                  <label className="venue-label">
                    <Mail size={14} /> Email
                  </label>
                  <input
                    className="venue-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="optik88@email.com"
                  />
                </div>

                {/* Instagram */}
                <div className="venue-field">
                  <label className="venue-label">
                    <Instagram size={14} /> Instagram (opsional)
                  </label>
                  <input
                    className="venue-input"
                    value={form.instagram}
                    onChange={(e) => handleChange('instagram', e.target.value)}
                    placeholder="@optik88"
                  />
                </div>

                {/* Website */}
                <div className="venue-field">
                  <label className="venue-label">
                    <Globe size={14} /> Website (opsional)
                  </label>
                  <input
                    className="venue-input"
                    value={form.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://optik88.com"
                  />
                </div>

                {/* Catatan Footer Invoice */}
                <div className="venue-field full-col">
                  <label className="venue-label">
                    <Edit size={14} /> Catatan Footer Invoice
                  </label>
                  <textarea
                    className="venue-input venue-textarea"
                    value={form.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Terima kasih atas kepercayaan Anda..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="venue-actions">
                <button className="settings-action-btn venue-save-btn" onClick={handleSave}>
                  {saved ? <CheckCircle size={18} /> : <Save size={18} />}
                  {saved ? 'Tersimpan!' : 'Simpan Perubahan'}
                </button>
                <button className="btn-outline-muted venue-reset-btn" onClick={handleReset}>
                  <RotateCcw size={16} /> Reset Default
                </button>
              </div>
            </div>

            {/* Preview Card */}
            <div className="venue-preview-card">
              <div className="venue-preview-label">📄 Preview Header Invoice</div>
              <div className="venue-invoice-preview">
                <div className="vip-logo">{form.name || 'Nama Optik'}</div>
                {form.tagline && <div className="vip-tagline">{form.tagline}</div>}
                <div className="vip-divider" />
                {form.address && <div className="vip-row">📍 {form.address}{form.city ? `, ${form.city}` : ''}</div>}
                {form.phone && <div className="vip-row">📞 {form.phone}</div>}
                {form.whatsapp && <div className="vip-row">💬 WA: {form.whatsapp}</div>}
                {form.email && <div className="vip-row">✉️ {form.email}</div>}
                {form.instagram && <div className="vip-row">📸 {form.instagram}</div>}
              </div>

              <div className="venue-preview-label" style={{ marginTop: '1.25rem' }}>🧾 Preview Footer Invoice</div>
              <div className="venue-footer-preview">
                <p>{form.notes || '—'}</p>
                {form.website && <p style={{ marginTop: 4 }}>🌐 {form.website}</p>}
              </div>

              <div className="venue-storage-note">
                <CheckCircle size={14} />
                Data disimpan di perangkat ini (localStorage). Berlaku untuk semua invoice &amp; struk cetak.
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: INTEGRASI & PERANGKAT ===== */}
        {activeTab === 'perangkat' && (
          <div className="settings-grid">
            {/* WhatsApp Card */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon wa">
                  <MessageCircle size={24} color="white" />
                </div>
                <div>
                  <h3 className="settings-card-title">Koneksi WhatsApp</h3>
                  <p className="settings-card-subtitle">Kirim struk digital &amp; notifikasi otomatis ke pasien.</p>
                </div>
              </div>
              <div className="settings-card-body">
                {waConnected ? (
                  <div className="wa-status connected">
                    <CheckCircle size={20} />
                    <span>WhatsApp telah terhubung (0812-xxxx-xxxx)</span>
                  </div>
                ) : (
                  <div className="wa-status disconnected">
                    <AlertCircle size={20} />
                    <span>WhatsApp belum terhubung</span>
                  </div>
                )}

                {!waConnected ? (
                  <div className="wa-connect-box">
                    <div className="qr-placeholder">
                      <span className="qr-text">Scan QR Code di sini</span>
                    </div>
                    <button className="settings-action-btn wa-btn" onClick={() => setWaConnected(true)}>
                      Simulasi Scan Berhasil
                    </button>
                  </div>
                ) : (
                  <button className="btn-outline-danger mt-3" onClick={() => setWaConnected(false)}>
                    Putuskan Koneksi
                  </button>
                )}
              </div>
            </div>

            {/* Printer Card */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon printer">
                  <Printer size={24} color="white" />
                </div>
                <div>
                  <h3 className="settings-card-title">Printer Bluetooth (Thermal)</h3>
                  <p className="settings-card-subtitle">Hubungkan printer kasir 58mm/80mm via Web Bluetooth.</p>
                </div>
              </div>
              <div className="settings-card-body">
                {printerConnected ? (
                  <div className="printer-status connected">
                    <CheckCircle size={20} />
                    <span>Printer Bluetooth Terhubung</span>
                  </div>
                ) : (
                  <div className="printer-status disconnected">
                    <AlertCircle size={20} />
                    <span>Belum ada printer yang terhubung</span>
                  </div>
                )}
                <div className="printer-info">
                  <p>Browser akan meminta izin untuk memindai perangkat Bluetooth di sekitar Anda. Pastikan Bluetooth pada printer dan perangkat Anda sudah menyala.</p>
                </div>
                <button className="settings-action-btn printer-btn" onClick={handleConnectPrinter}>
                  <Printer size={18} /> {printerConnected ? 'Hubungkan Printer Lain' : 'Cari & Hubungkan Printer'}
                </button>
                {printerConnected && (
                  <button className="btn-outline-danger mt-3" onClick={() => setPrinterConnected(false)}>
                    Putuskan Printer
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB: AKSES PENGGUNA ===== */}
        {activeTab === 'akses' && (
          <div className="settings-card full-width">
            <div className="settings-card-header flex-between">
              <div>
                <h3 className="settings-card-title">Manajemen Akses Pengguna</h3>
                <p className="settings-card-subtitle">Atur siapa saja yang bisa masuk ke sistem dan hak akses mereka.</p>
              </div>
              <button className="settings-action-btn btn-add-staff" style={{ width: 'auto' }}>
                <UserPlus size={16} /> Tambah Staf
              </button>
            </div>

            <div className="table-responsive">
              <table className="table users-table">
                <thead>
                  <tr>
                    <th>Nama Lengkap</th>
                    <th>Username</th>
                    <th>Role (Hak Akses)</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="fw-bold text-primary-dark">{u.name}</td>
                      <td>{u.username}</td>
                      <td>
                        <span className={`role-badge role-${u.role}`}>{u.role}</span>
                      </td>
                      <td>
                        <span className="status-badge active">{u.status}</span>
                      </td>
                      <td>
                        <button className="btn-icon text-primary"><Edit size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
