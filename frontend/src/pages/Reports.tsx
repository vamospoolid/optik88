import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionsService, patientsService, stockService, examinationsService } from '../services/api';
import type { Transaction, Patient, StockItem } from 'optik88-shared';
import {
  TrendingUp, ShoppingBag, Users, Package, AlertTriangle,
  Calendar, ChevronLeft, ChevronRight, Download, FileText, Loader2
} from 'lucide-react';
import './Reports.css';

const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

type ReportPeriod = 'harian' | 'bulanan' | 'tahunan';
type ReportTab = 'penjualan' | 'stok' | 'pasien';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const Reports: React.FC = () => {
  const [period, setPeriod] = useState<ReportPeriod>('bulanan');
  const [tab, setTab] = useState<ReportTab>('penjualan');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Queries
  const { data: transactions = [], isLoading: loadTrx } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: transactionsService.getAll,
  });

  const { data: patients = [], isLoading: loadPatients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: patientsService.getAll,
  });

  const { data: stockItems = [], isLoading: loadStock } = useQuery<StockItem[]>({
    queryKey: ['stock'],
    queryFn: stockService.getAll,
  });

  const { data: examinations = [], isLoading: loadExams } = useQuery<any[]>({
    queryKey: ['examinations'],
    queryFn: () => examinationsService.getAll(),
  });

  const isLoading = loadTrx || loadPatients || loadStock || loadExams;

  const navigate = (dir: number) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (period === 'harian') d.setDate(d.getDate() + dir);
      else if (period === 'bulanan') d.setMonth(d.getMonth() + dir);
      else d.setFullYear(d.getFullYear() + dir);
      return d;
    });
  };

  const periodLabel = useMemo(() => {
    if (period === 'harian') {
      return currentDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else if (period === 'bulanan') {
      return `${MONTHS_ID[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      return `Tahun ${currentDate.getFullYear()}`;
    }
  }, [period, currentDate]);

  // Filter transactions by period
  const filteredTrx = useMemo<Transaction[]>(() => {
    return transactions.filter(t => {
      const d = new Date(t.created_at);
      if (period === 'harian') {
        return d.toDateString() === currentDate.toDateString();
      } else if (period === 'bulanan') {
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      } else {
        return d.getFullYear() === currentDate.getFullYear();
      }
    });
  }, [transactions, period, currentDate]);

  // Revenue summary
  const totalRevenue = filteredTrx.reduce((s, t) => s + t.paid_amount, 0);
  const totalOrders = filteredTrx.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalDiscount = filteredTrx.reduce((s, t) => s + (t.discount || 0), 0);

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    filteredTrx.forEach(t => {
      const method = t.payment_method || 'tunai';
      if (!map[method]) map[method] = { count: 0, amount: 0 };
      map[method].count++;
      map[method].amount += t.paid_amount;
    });
    return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount);
  }, [filteredTrx]);

  // Top items sold
  const topItems = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number; type: string }> = {};
    filteredTrx.forEach(t => {
      (t.items || []).forEach(item => {
        const key = item.name;
        if (!map[key]) map[key] = { name: item.name, qty: 0, revenue: 0, type: item.product_type };
        map[key].qty += item.qty;
        map[key].revenue += item.subtotal;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [filteredTrx]);

  // Monthly trend chart data (last 6 months from current)
  const trendData = useMemo(() => {
    const months: { label: string; revenue: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - i);
      const monthTrx = transactions.filter(t => {
        const td = new Date(t.created_at);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      months.push({
        label: MONTHS_ID[d.getMonth()].substring(0, 3),
        revenue: monthTrx.reduce((s, t) => s + t.paid_amount, 0),
        orders: monthTrx.length
      });
    }
    return months;
  }, [transactions, currentDate]);

  const maxRevenue = Math.max(...trendData.map(d => d.revenue), 1);

  // Stock alerts
  const lowStockItems = stockItems.filter(s => s.category !== 'service' && s.stock <= s.min_stock);
  const outOfStockItems = stockItems.filter(s => s.category !== 'service' && s.stock === 0);

  // Patient stats
  const bpjsPatients = patients.filter(p => p.bpjs_number).length;
  const generalPatients = patients.length - bpjsPatients;

  // Examinations in period
  const examsInPeriod = examinations.filter(e => {
    if (period === 'bulanan') {
      const d = new Date(e.exam_date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    }
    return true;
  });

  return (
    <div className="reports-page animate-fade-in">
      {/* ── Hero ── */}
      <div className="reports-hero">
        <div className="reports-hero-left">
          <div className="reports-hero-icon"><TrendingUp size={26} /></div>
          <div>
            <h1>Laporan & Analitik</h1>
            <p>Pantau performa penjualan, stok, dan pasien secara berkala.</p>
          </div>
        </div>
        <div className="reports-hero-right">
          <button className="btn-report-export" onClick={() => window.print()}>
            <Download size={16} /> Ekspor PDF
          </button>
        </div>
      </div>

      {/* Period Selector + Tab */}
      <div className="reports-controls">
        {/* Period tabs */}
        <div className="period-tabs">
          {(['harian', 'bulanan', 'tahunan'] as ReportPeriod[]).map(p => (
            <button
              key={p}
              className={`period-tab ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Date Navigator */}
        <div className="date-navigator">
          <button className="nav-arrow" onClick={() => navigate(-1)}><ChevronLeft size={18} /></button>
          <div className="period-display">
            <Calendar size={16} />
            <span>{periodLabel}</span>
          </div>
          <button className="nav-arrow" onClick={() => navigate(1)}><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="report-type-tabs">
        <button className={`rtype-btn ${tab === 'penjualan' ? 'active' : ''}`} onClick={() => setTab('penjualan')}>
          <TrendingUp size={16} /> Penjualan
        </button>
        <button className={`rtype-btn ${tab === 'stok' ? 'active' : ''}`} onClick={() => setTab('stok')}>
          <Package size={16} /> Inventaris & Stok
        </button>
        <button className={`rtype-btn ${tab === 'pasien' ? 'active' : ''}`} onClick={() => setTab('pasien')}>
          <Users size={16} /> Data Pasien
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px] flex-col gap-2">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-gray-500">Mengkalkulasi laporan...</p>
        </div>
      ) : (
        <>
          {/* ── TAB: PENJUALAN ── */}
          {tab === 'penjualan' && (
            <div className="tab-content animate-fade-in">
              {/* KPI Cards */}
              <div className="kpi-grid">
                <div className="kpi-card kpi-primary">
                  <div className="kpi-icon"><TrendingUp size={22} /></div>
                  <div className="kpi-data">
                    <p className="kpi-label">Total Pendapatan</p>
                    <h2 className="kpi-value">{rp(totalRevenue)}</h2>
                  </div>
                </div>
                <div className="kpi-card kpi-secondary">
                  <div className="kpi-icon"><ShoppingBag size={22} /></div>
                  <div className="kpi-data">
                    <p className="kpi-label">Jumlah Transaksi</p>
                    <h2 className="kpi-value">{totalOrders}</h2>
                  </div>
                </div>
                <div className="kpi-card kpi-warning">
                  <div className="kpi-icon"><FileText size={22} /></div>
                  <div className="kpi-data">
                    <p className="kpi-label">Rata-rata Per Order</p>
                    <h2 className="kpi-value">{rp(avgOrderValue)}</h2>
                  </div>
                </div>
                <div className="kpi-card kpi-danger">
                  <div className="kpi-icon"><AlertTriangle size={22} /></div>
                  <div className="kpi-data">
                    <p className="kpi-label">Total Diskon</p>
                    <h2 className="kpi-value">{rp(totalDiscount)}</h2>
                  </div>
                </div>
              </div>

              {/* Trend Chart + Payment Breakdown */}
              <div className="charts-row">
                {/* Mini Bar Chart - Revenue Trend */}
                <div className="chart-card flex-2">
                  <h3 className="chart-title">Tren Pendapatan 6 Bulan Terakhir</h3>
                  <div className="bar-chart">
                    {trendData.map((d, i) => (
                      <div key={i} className="bar-group">
                        <div className="bar-wrap">
                          <div
                            className="bar-fill"
                            style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                            title={rp(d.revenue)}
                          />
                        </div>
                        <span className="bar-label">{d.label}</span>
                        <span className="bar-value">{d.orders} order</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Method Breakdown */}
                <div className="chart-card flex-1">
                  <h3 className="chart-title">Metode Pembayaran</h3>
                  {paymentBreakdown.length === 0 ? (
                    <div className="empty-chart">Tidak ada data untuk periode ini</div>
                  ) : (
                    <div className="payment-breakdown-list">
                      {paymentBreakdown.map(([method, data]) => {
                        const pct = totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0;
                        const colorMap: Record<string, string> = {
                          tunai: '#4f46e5', transfer: '#10b981', debit: '#f59e0b', kredit: '#ef4444', bpjs: '#06b6d4'
                        };
                        return (
                          <div key={method} className="pay-method-row">
                            <div className="pay-method-info">
                              <span className="pay-dot" style={{ background: colorMap[method] || '#999' }} />
                              <span className="pay-method-name">{method.toUpperCase()}</span>
                              <span className="pay-count">({data.count}x)</span>
                            </div>
                            <div className="pay-bar-wrap">
                              <div className="pay-bar-track">
                                <div className="pay-bar-fill" style={{ width: `${pct}%`, background: colorMap[method] || '#999' }} />
                              </div>
                              <span className="pay-pct">{pct.toFixed(0)}%</span>
                            </div>
                            <span className="pay-amount">{rp(data.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Top Items Table */}
              <div className="report-table-card">
                <h3 className="chart-title">Item Paling Laris</h3>
                {topItems.length === 0 ? (
                  <div className="empty-chart">Tidak ada transaksi dalam periode ini.</div>
                ) : (
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nama Item</th>
                        <th>Kategori</th>
                        <th className="text-center">Qty Terjual</th>
                        <th className="text-right">Total Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topItems.map((item, i) => (
                        <tr key={i}>
                          <td className="rank-num">{i + 1}</td>
                          <td><strong>{item.name}</strong></td>
                          <td><span className={`cat-tag tag-${item.type}`}>{item.type.toUpperCase()}</span></td>
                          <td className="text-center font-bold">{item.qty} pcs</td>
                          <td className="text-right font-bold text-primary">{rp(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Raw Transactions */}
              <div className="report-table-card">
                <h3 className="chart-title">Daftar Transaksi ({filteredTrx.length})</h3>
                {filteredTrx.length === 0 ? (
                  <div className="empty-chart">Tidak ada transaksi dalam periode ini.</div>
                ) : (
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Pasien</th>
                        <th>Tgl. Transaksi</th>
                        <th>Metode</th>
                        <th className="text-right">Total</th>
                        <th className="text-right">Terbayar</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrx.map(t => {
                        const patient = patients.find(p => p.id === t.patient_id);
                        return (
                          <tr key={t.id}>
                            <td className="font-mono text-sm">{t.invoice_number}</td>
                            <td>{patient?.name || '—'}</td>
                            <td className="text-sm text-secondary">{new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                            <td><span className="method-badge">{(t.payment_method || 'tunai').toUpperCase()}</span></td>
                            <td className="text-right">{rp(t.total_amount)}</td>
                            <td className="text-right font-bold text-secondary">{rp(t.paid_amount)}</td>
                            <td>
                              <span className={`status-pill ${t.payment_status}`}>
                                {t.payment_status === 'lunas' ? '✅ Lunas' : t.payment_status === 'dp' ? '⚡ DP' : '⏳ Belum'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: STOK ── */}
          {tab === 'stok' && (
            <div className="tab-content animate-fade-in">
              <div className="kpi-grid">
                <div className="kpi-card kpi-primary">
                  <div className="kpi-icon"><Package size={22} /></div>
                  <div className="kpi-data">
                    <p className="kpi-label">Total SKU Barang</p>
                    <h2 className="kpi-value">{stockItems.filter(s => s.category !== 'service').length}</h2>
                  </div>
                </div>
                <div className="kpi-card kpi-warning">
                  <div className="kpi-icon"><AlertTriangle size={22} /></div>
                  <div className="kpi-data">
                    <p className="kpi-label">Stok Menipis</p>
                    <h2 className="kpi-value">{lowStockItems.length}</h2>
                  </div>
                </div>
                <div className="kpi-card kpi-danger">
                  <div className="kpi-icon"><AlertTriangle size={22} /></div>
                  <div className="kpi-data">
                    <p className="kpi-label">Stok Habis</p>
                    <h2 className="kpi-value">{outOfStockItems.length}</h2>
                  </div>
                </div>
                <div className="kpi-card kpi-secondary">
                  <div className="kpi-icon"><ShoppingBag size={22} /></div>
                  <div className="kpi-data">
                    <p className="kpi-label">Total Nilai Modal</p>
                    <h2 className="kpi-value" style={{ fontSize: '1rem' }}>
                      {rp(stockItems.filter(s => s.category !== 'service').reduce((sum, s) => sum + s.modal_price * s.stock, 0))}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Low Stock Alert Table */}
              {lowStockItems.length > 0 && (
                <div className="report-table-card border-warning-left">
                  <h3 className="chart-title text-warning">⚠️ Peringatan Stok Menipis & Habis</h3>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Kategori</th>
                        <th>Brand & Nama</th>
                        <th>SKU</th>
                        <th className="text-center">Stok Saat Ini</th>
                        <th className="text-center">Minimum Stok</th>
                        <th>Status</th>
                        <th className="text-right">Harga Jual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.map(item => (
                        <tr key={item.id} className={item.stock === 0 ? 'tr-danger' : 'tr-warning'}>
                          <td><span className={`cat-tag tag-${item.category}`}>{item.category.toUpperCase()}</span></td>
                          <td><strong>{item.brand}</strong> {item.name}</td>
                          <td className="font-mono text-sm">{item.sku || 'N/A'}</td>
                          <td className={`text-center font-bold ${item.stock === 0 ? 'text-danger' : 'text-warning'}`}>
                            {item.stock} pcs
                          </td>
                          <td className="text-center text-secondary">{item.min_stock} pcs</td>
                          <td>
                            <span className={`status-pill ${item.stock === 0 ? 'belum_bayar' : 'dp'}`}>
                              {item.stock === 0 ? '🔴 HABIS' : '🟡 MENIPIS'}
                            </span>
                          </td>
                          <td className="text-right">{rp(item.sell_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* All Stock Summary */}
              <div className="report-table-card">
                <h3 className="chart-title">Ringkasan Semua Barang</h3>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Kategori</th>
                      <th>Brand & Nama</th>
                      <th>Supplier</th>
                      <th className="text-right">Harga Modal</th>
                      <th className="text-right">Harga Jual</th>
                      <th className="text-center">Stok</th>
                      <th className="text-right">Nilai Modal Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockItems.map(item => (
                      <tr key={item.id}>
                        <td><span className={`cat-tag tag-${item.category}`}>{item.category.toUpperCase()}</span></td>
                        <td>
                          <div><strong>{item.brand}</strong> {item.name}</div>
                          {item.description && <div className="text-xs text-secondary">{item.description}</div>}
                        </td>
                        <td className="text-secondary text-sm">{item.supplier || '—'}</td>
                        <td className="text-right text-secondary">{rp(item.modal_price)}</td>
                        <td className="text-right font-bold">{rp(item.sell_price)}</td>
                        <td className="text-center">
                          {item.category === 'service' ? '∞' : <span className={item.stock <= item.min_stock ? 'text-warning font-bold' : ''}>{item.stock} pcs</span>}
                        </td>
                        <td className="text-right text-secondary">
                          {item.category === 'service' ? '—' : rp(item.modal_price * item.stock)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB: PASIEN ── */}
          {tab === 'pasien' && (
            <div className="tab-content animate-fade-in">
              <div className="kpi-grid">
                <div className="kpi-card kpi-primary">
                  <div className="kpi-icon"><Users size={22} /></div>
                  <div className="kpi-data">
                    <p className="kpi-label">Total Pasien Terdaftar</p>
                    <h2 className="kpi-value">{patients.length}</h2>
                  </div>
                </div>
                <div className="kpi-card kpi-secondary">
                  <div className="kpi-icon"><Users size={22} /></div>
                  <div className="kpi-data">
                    <p className="kpi-label">Pasien BPJS</p>
                    <h2 className="kpi-value">{bpjsPatients}</h2>
                  </div>
                </div>
                <div className="kpi-card kpi-warning">
                  <div className="kpi-icon"><Users size={22} /></div>
                  <div className="kpi-data">
                    <p className="kpi-label">Pasien Umum</p>
                    <h2 className="kpi-value">{generalPatients}</h2>
                  </div>
                </div>
                <div className="kpi-card kpi-danger">
                  <div className="kpi-icon"><Calendar size={22} /></div>
                  <div className="kpi-data">
                    <p className="kpi-label">Pemeriksaan Periode Ini</p>
                    <h2 className="kpi-value">{examsInPeriod.length}</h2>
                  </div>
                </div>
              </div>

              {/* Pasien BPJS vs Umum visual bar */}
              <div className="report-table-card">
                <h3 className="chart-title">Komposisi Pasien BPJS vs Umum</h3>
                <div className="composition-bar-wrap">
                  <div className="composition-bar">
                    {bpjsPatients > 0 && (
                      <div
                        className="comp-seg bpjs-seg"
                        style={{ width: `${(bpjsPatients / Math.max(patients.length, 1)) * 100}%` }}
                        title={`BPJS: ${bpjsPatients} pasien`}
                      >
                        BPJS {Math.round((bpjsPatients / Math.max(patients.length, 1)) * 100)}%
                      </div>
                    )}
                    {generalPatients > 0 && (
                      <div
                        className="comp-seg umum-seg"
                        style={{ width: `${(generalPatients / Math.max(patients.length, 1)) * 100}%` }}
                        title={`Umum: ${generalPatients} pasien`}
                      >
                        Umum {Math.round((generalPatients / Math.max(patients.length, 1)) * 100)}%
                      </div>
                    )}
                  </div>
                  <div className="comp-legend">
                    <span className="leg-item"><span className="leg-dot bpjs-dot" /> BPJS ({bpjsPatients} pasien)</span>
                    <span className="leg-item"><span className="leg-dot umum-dot" /> Umum ({generalPatients} pasien)</span>
                  </div>
                </div>
              </div>

              {/* Pasien list */}
              <div className="report-table-card">
                <h3 className="chart-title">Daftar Semua Pasien Terdaftar</h3>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nama Pasien</th>
                      <th>No. Telepon</th>
                      <th>Tipe</th>
                      <th>No. BPJS</th>
                      <th>Total Transaksi</th>
                      <th className="text-right">Total Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map(p => {
                      const pTrx = transactions.filter(t => t.patient_id === p.id);
                      const pTotal = pTrx.reduce((s, t) => s + t.total_amount, 0);
                      return (
                        <tr key={p.id}>
                          <td className="font-mono text-sm">{p.id}</td>
                          <td><strong>{p.name}</strong></td>
                          <td className="text-secondary">{p.phone || '—'}</td>
                          <td>
                            <span className={`status-pill ${p.bpjs_number ? 'lunas' : 'dp'}`}>
                              {p.bpjs_number ? '🏥 BPJS' : '👤 Umum'}
                            </span>
                          </td>
                          <td className="font-mono text-sm">{p.bpjs_number || '—'}</td>
                          <td className="text-center">{pTrx.length}x</td>
                          <td className="text-right font-bold">{rp(pTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
