import React, { useState } from 'react';
import { Settings as SettingsIcon, MessageCircle, Printer, Users, CheckCircle, Smartphone, UserPlus, AlertCircle, Edit } from 'lucide-react';
import './Settings.css';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'perangkat' | 'akses'>('perangkat');
  const [waConnected, setWaConnected] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(false);
  
  // Mock users
  const [users] = useState([
    { id: '1', name: 'Budi (Owner)', username: 'owner', role: 'owner', status: 'aktif' },
    { id: '2', name: 'Siti (Admin)', username: 'admin', role: 'admin', status: 'aktif' },
    { id: '3', name: 'Andi (Kasir)', username: 'kasir', role: 'kasir', status: 'aktif' },
    { id: '4', name: 'Dr. Linda (RO)', username: 'optometris', role: 'optometris', status: 'aktif' },
  ]);

  const handleConnectPrinter = async () => {
    try {
      if (!navigator.bluetooth) {
        alert('Web Bluetooth API tidak didukung di browser ini. Gunakan Chrome di Android/PC.');
        return;
      }
      // Request bluetooth device
      await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] // generic printer service
      });
      setPrinterConnected(true);
    } catch (err) {
      console.error(err);
      // Kalau user cancel atau error
      if (!printerConnected) {
         // Biarkan disconnected
      }
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
            <p>Kelola integrasi WhatsApp, printer struk, dan hak akses staf optik.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button className={`settings-tab ${activeTab === 'perangkat' ? 'active' : ''}`} onClick={() => setActiveTab('perangkat')}>
          <Smartphone size={16} /> Integrasi & Perangkat
        </button>
        <button className={`settings-tab ${activeTab === 'akses' ? 'active' : ''}`} onClick={() => setActiveTab('akses')}>
          <Users size={16} /> Akses Pengguna
        </button>
      </div>

      {/* Body */}
      <div className="settings-content">
        {activeTab === 'perangkat' ? (
          <div className="settings-grid">
            {/* WhatsApp Card */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon wa">
                  <MessageCircle size={24} color="white" />
                </div>
                <div>
                  <h3 className="settings-card-title">Koneksi WhatsApp</h3>
                  <p className="settings-card-subtitle">Kirim struk digital & notifikasi otomatis ke pasien.</p>
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
        ) : (
          <div className="settings-card full-width">
            <div className="settings-card-header flex-between">
              <div>
                <h3 className="settings-card-title">Manajemen Akses Pengguna</h3>
                <p className="settings-card-subtitle">Atur siapa saja yang bisa masuk ke sistem dan hak akses mereka (Admin, Kasir, RO).</p>
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
