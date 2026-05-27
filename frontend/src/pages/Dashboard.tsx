import React, { useState } from 'react';
import { Users, Activity, ShoppingBag, AlertTriangle, Plus, Loader2, Coins, Calendar, ArrowRight, Eye, BarChart2, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { patientsService, examinationsService, transactionsService, stockService } from '../services/api';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InvoiceModal from '../components/InvoiceModal';
import type { Patient, EyeExamination, Transaction, StockItem } from 'optik88-shared';

const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);

  // Queries using React Query
  const { data: patients, isLoading: loadPatients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: patientsService.getAll,
  });

  const { data: examinations, isLoading: loadExams } = useQuery<EyeExamination[]>({
    queryKey: ['examinations'],
    queryFn: () => examinationsService.getAll(),
  });

  const { data: transactions, isLoading: loadTrx } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: transactionsService.getAll,
  });

  const { data: stockItems, isLoading: loadStock } = useQuery<StockItem[]>({
    queryKey: ['stock'],
    queryFn: stockService.getAll,
  });

  const isLoading = loadPatients || loadExams || loadTrx || loadStock;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] flex-col gap-2">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-gray-500">Memuat ringkasan data...</p>
      </div>
    );
  }

  // Calculate stats dynamically
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localTodayStr = new Date(today.getTime() - (offset * 60000)).toISOString().split('T')[0];

  const todayPatients = patients?.filter((p) => {
    if (!p.created_at) return false;
    const d = new Date(p.created_at);
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }) || [];

  const todayExams = examinations?.filter((e) => {
    const d = new Date(e.exam_date);
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }) || [];

  const todayTransactions = transactions?.filter((t) => {
    const d = new Date(t.created_at);
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }) || [];

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.paid_amount, 0);
  const totalRevenue = transactions?.reduce((sum, t) => sum + t.paid_amount, 0) || 0;
  const lowStockItems = stockItems?.filter((s) => s.category !== 'service' && s.stock <= s.min_stock) || [];

  // Drawer breakdown (Today's Cashflow collected)
  const drawerBreakdown = {
    tunai: todayTransactions.filter(t => t.payment_method === 'tunai').reduce((sum, t) => sum + t.paid_amount, 0),
    transfer: todayTransactions.filter(t => t.payment_method === 'transfer').reduce((sum, t) => sum + t.paid_amount, 0),
    debit: todayTransactions.filter(t => t.payment_method === 'debit').reduce((sum, t) => sum + t.paid_amount, 0),
    kredit: todayTransactions.filter(t => t.payment_method === 'kredit').reduce((sum, t) => sum + t.paid_amount, 0),
    bpjs: todayTransactions.filter(t => t.payment_method === 'bpjs').reduce((sum, t) => sum + t.paid_amount, 0),
  };

  const statCards = [
    {
      title: 'Pasien Baru (Hari Ini)',
      value: todayPatients.length,
      subtext: `Total: ${patients?.length || 0} Pasien`,
      icon: <Users size={22} />,
      color: 'primary',
    },
    {
      title: 'Refraksi / Periksa (Hari Ini)',
      value: todayExams.length,
      subtext: `Total: ${examinations?.length || 0} Periksa`,
      icon: <Activity size={22} />,
      color: 'secondary',
    },
    {
      title: 'Setoran Kasir (Hari Ini)',
      value: rp(todayRevenue),
      subtext: `Akumulasi: ${rp(totalRevenue)}`,
      icon: <Coins size={22} />,
      color: 'success',
    },
    {
      title: 'Stok Menipis (Peringatan)',
      value: lowStockItems.length,
      subtext: `${lowStockItems.slice(0, 2).map(s => s.name).join(', ') || 'Semua stok aman'}`,
      icon: <AlertTriangle size={22} />,
      color: lowStockItems.length > 0 ? 'danger' : 'success',
    },
  ];

  // Quick Actions Menu items based on role
  const quickActions = [
    {
      title: 'Pasien Baru',
      desc: 'Daftarkan pasien optik',
      path: '/pasien',
      icon: <Users size={22} />,
      color: 'primary',
      roles: ['admin', 'kasir', 'optometris'],
    },
    {
      title: 'Pemeriksaan',
      desc: 'Input resep & hasil periksa',
      path: '/periksa',
      icon: <Activity size={22} />,
      color: 'secondary',
      roles: ['admin', 'optometris'],
    },
    {
      title: 'Transaksi Baru',
      desc: 'Buat pesanan kacamata',
      path: '/transaksi/baru',
      icon: <ShoppingBag size={22} />,
      color: 'success',
      roles: ['admin', 'kasir'],
    },
    {
      title: 'Buku Kas',
      desc: 'Catat kas masuk/keluar',
      path: '/kas',
      icon: <Coins size={22} />,
      color: 'info',
      roles: ['admin', 'kasir', 'owner'],
    },
    {
      title: 'Stok Inventori',
      desc: 'Kelola frame & lensa',
      path: '/stok',
      icon: <Package size={22} />,
      color: 'warning',
      roles: ['admin'],
    },
    {
      title: 'Laporan',
      desc: 'Grafik & unduh laporan',
      path: '/laporan',
      icon: <BarChart2 size={22} />,
      color: 'danger',
      roles: ['admin', 'owner'],
    },
  ].filter(action => user && action.roles.includes(user.role));

  return (
    <div className="dashboard animate-fade-in">
      {/* Premium Hero Header */}
      <div className="db-hero-wrapper">
        <div className="db-hero">
          <div className="db-hero-left">
            <span className="db-hero-badge">POS & Clinical Suite v1.2</span>
            <h1>Selamat Pagi, {user?.name || 'User'}</h1>
            <p>Selamat bertugas! Pantau ringkasan operasional dan catatan klinis Optik88 secara real-time hari ini.</p>
          </div>
          <div className="db-hero-right">
            <div className="date-display-card">
              <Calendar size={20} />
              <div>
                <strong>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
                <span>Hari Operasional Kasir</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="stats-grid">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`stat-card border-${stat.color}`}>
            <div className="stat-card-top">
              <div className={`stat-icon-wrapper bg-${stat.color}-light text-${stat.color}`}>
                {stat.icon}
              </div>
              <h3>{stat.value}</h3>
            </div>
            <div className="stat-card-bottom">
              <p className="stat-title">{stat.title}</p>
              <p className="stat-subtext">{stat.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Two Column Grid */}
      <div className="db-main-layout">
        {/* Left Column: Actions & Recent Transactions */}
        <div className="db-left-col">
          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h2 className="section-title">Komposisi Modul Operasional</h2>
            <div className="quick-actions-grid">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  className={`quick-action-btn border-${action.color}-hover`}
                  onClick={() => navigate(action.path)}
                >
                  <div className={`action-icon bg-${action.color}-light text-${action.color}`}>
                    {action.icon}
                  </div>
                  <div className="action-text">
                    <h4>{action.title}</h4>
                    <p>{action.desc}</p>
                  </div>
                  <div className="action-plus"><Plus size={16} /></div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="db-table-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Aktivitas Transaksi Terakhir</h3>
                <p className="card-subtitle">Daftar transaksi kasir terbaru hari ini</p>
              </div>
              <button className="btn-link" onClick={() => navigate('/transaksi')}>
                Semua Transaksi <ArrowRight size={14} />
              </button>
            </div>

            <div className="table-responsive">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Pasien</th>
                    <th>Metode</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions && transactions.length > 0 ? (
                    transactions.slice(0, 5).map((t) => {
                      const p = patients?.find((pat) => pat.id === t.patient_id);
                      return (
                        <tr key={t.id}>
                          <td><strong>{t.invoice_number}</strong></td>
                          <td>
                            <div className="table-patient-cell">
                              <strong>{p?.name || 'Pasien Umum'}</strong>
                              <span>{p?.phone || '—'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="payment-method-tag">{t.payment_method.toUpperCase()}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}><strong>{rp(t.total_amount)}</strong></td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`db-badge badge-${t.payment_status}`}>
                              {t.payment_status === 'lunas' ? 'LUNAS' : t.payment_status === 'dp' ? 'DP' : 'BELUM BAYAR'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="action-icon-btn text-primary"
                              onClick={() => setSelectedTrx(t)}
                              title="Lihat Invoice"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Belum ada transaksi hari ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Cash Drawer Summary, Low Stock & Refractions */}
        <div className="db-right-col">
          {/* Cash Drawer Drawer Summary */}
          <div className="db-widget-card border-success">
            <h3 className="widget-title">💰 Pendapatan Kasir (Hari Ini)</h3>
            <p className="widget-subtitle">Rincian uang masuk laci kasir per metode</p>
            <div className="drawer-breakdown-list">
              <div className="drawer-row">
                <div className="drawer-lbl">💵 Uang Tunai (Fisik)</div>
                <strong className="text-success">{rp(drawerBreakdown.tunai)}</strong>
              </div>
              <div className="drawer-row">
                <div className="drawer-lbl">🏦 Transfer Bank</div>
                <strong>{rp(drawerBreakdown.transfer)}</strong>
              </div>
              <div className="drawer-row">
                <div className="drawer-lbl">💳 Kartu Debit</div>
                <strong>{rp(drawerBreakdown.debit)}</strong>
              </div>
              <div className="drawer-row">
                <div className="drawer-lbl">💳 Kartu Kredit</div>
                <strong>{rp(drawerBreakdown.kredit)}</strong>
              </div>
              <div className="drawer-row">
                <div className="drawer-lbl">🏥 Klaim BPJS</div>
                <strong>{rp(drawerBreakdown.bpjs)}</strong>
              </div>
            </div>
            <div className="drawer-total-block">
              <span>Total Uang Laci Kasir:</span>
              <strong>{rp(todayRevenue)}</strong>
            </div>
          </div>

          {/* Last 3 Eye Examinations Log */}
          <div className="db-widget-card">
            <h3 className="widget-title">🔬 Catatan Refraksi Terakhir</h3>
            <p className="widget-subtitle">Pasien yang selesai melakukan pemeriksaan</p>
            <div className="rx-widget-list">
              {examinations && examinations.length > 0 ? (
                examinations.slice(0, 3).map((e) => {
                  const pat = patients?.find(p => p.id === e.patient_id);
                  const sphR = e.prescription?.details?.find(d => d.eye === 'R')?.sph;
                  const sphL = e.prescription?.details?.find(d => d.eye === 'L')?.sph;
                  const pd = e.prescription?.pd;
                  return (
                    <div key={e.id} className="rx-widget-item">
                      <div className="rx-widget-header">
                        <strong>{pat?.name || 'Pasien'}</strong>
                        <span>{new Date(e.exam_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="rx-mini-grid">
                        <div>OD: <span>{sphR !== undefined ? (sphR > 0 ? `+${sphR}` : sphR) : '—'}</span></div>
                        <div>OS: <span>{sphL !== undefined ? (sphL > 0 ? `+${sphL}` : sphL) : '—'}</span></div>
                        <div>PD: <span>{pd ? `${pd} mm` : '—'}</span></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '1rem 0' }}>Belum ada riwayat pemeriksaan.</p>
              )}
            </div>
          </div>

          {/* Low Stock Items Card */}
          {lowStockItems.length > 0 && (
            <div className="db-widget-card border-danger bg-danger-light-widget">
              <h3 className="widget-title text-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <AlertTriangle size={18} /> Peringatan Stok Menipis!
              </h3>
              <p className="widget-subtitle">Barang di bawah batas stok minimum</p>
              <div className="stock-alert-list">
                {lowStockItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="stock-alert-item">
                    <div className="stock-alert-info">
                      <strong>{item.name}</strong>
                      <span>Kategori: {item.category.toUpperCase()} · Sisa: {item.stock} unit</span>
                    </div>
                    <span className="stock-alert-badge">Sisa {item.stock}</span>
                  </div>
                ))}
              </div>
              {lowStockItems.length > 4 && (
                <button className="btn-link text-danger" onClick={() => navigate('/stok')} style={{ marginTop: '0.5rem', display: 'block' }}>
                  Lihat {lowStockItems.length - 4} barang menipis lainnya...
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal for direct preview */}
      {selectedTrx && (
        <InvoiceModal
          trx={selectedTrx}
          onClose={() => setSelectedTrx(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
