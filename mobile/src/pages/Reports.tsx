import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Package, Activity, AlertTriangle, Loader2 } from 'lucide-react';
import { transactionsService, examinationsService, stockService } from '../services/api';

const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'sales' | 'clinical' | 'stock'>('sales');

  // Queries
  const { data: transactions = [], isLoading: isLoadingTrx } = useQuery<any[]>({
    queryKey: ['transactions'],
    queryFn: transactionsService.getAll,
  });

  const { data: examinations = [], isLoading: isLoadingExams } = useQuery<any[]>({
    queryKey: ['examinations'],
    queryFn: examinationsService.getAll,
  });

  const { data: stockItems = [], isLoading: isLoadingStock } = useQuery<any[]>({
    queryKey: ['stock'],
    queryFn: stockService.getAll,
  });

  // 1. Sales Report calculations
  const salesData = useMemo(() => {
    // Generate last 7 days list
    const chartMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      chartMap.set(dateStr, 0);
    }

    let revenue = 0;
    let orderCount = 0;
    const topItemsMap = new Map<string, number>();

    transactions.forEach(t => {
      if (t.payment_status === 'lunas' || t.payment_status === 'dp') {
        revenue += t.paid_amount;
      }
      orderCount++;

      // Chart daily group mapping
      const dateKey = t.created_at.split('T')[0];
      if (chartMap.has(dateKey)) {
        chartMap.set(dateKey, (chartMap.get(dateKey) || 0) + t.paid_amount);
      }

      // Top products map
      t.items?.forEach((item: any) => {
        topItemsMap.set(item.name, (topItemsMap.get(item.name) || 0) + item.qty);
      });
    });

    const chartData = Array.from(chartMap.entries()).map(([date, amt]) => {
      const d = new Date(date);
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
      return { name: dayLabel, revenue: amt };
    });

    const topItems = Array.from(topItemsMap.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      chartData,
      revenue,
      orderCount,
      avgTicket: orderCount > 0 ? revenue / orderCount : 0,
      topItems,
    };
  }, [transactions]);

  // 2. Clinical Report calculations
  const clinicalData = useMemo(() => {
    let internalCount = 0;
    let externalCount = 0;
    const lensTypeMap = new Map<string, number>();

    examinations.forEach(ex => {
      if (ex.source === 'internal') internalCount++;
      else {
        externalCount++;
        const type = ex.external_source_type || 'monofocal';
        lensTypeMap.set(type, (lensTypeMap.get(type) || 0) + 1);
      }
    });

    return {
      totalExams: examinations.length,
      internalCount,
      externalCount,
      lensTypes: Array.from(lensTypeMap.entries()).map(([name, qty]) => ({ name, qty })),
    };
  }, [examinations]);

  // 3. Stock Report calculations
  const stockData = useMemo(() => {
    let totalValuation = 0;
    const lowStock: any[] = [];

    stockItems.forEach(item => {
      if (item.category !== 'service') {
        totalValuation += item.stock * item.original_price;
        if (item.stock <= item.min_stock) {
          lowStock.push(item);
        }
      }
    });

    return {
      totalValuation,
      lowStock,
    };
  }, [stockItems]);

  const isLoading = isLoadingTrx || isLoadingExams || isLoadingStock;

  return (
    <div className="page-scroll animate-fade-in" style={{ paddingBottom: '6rem' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <span className="top-bar-title">Laporan Analisis</span>
        <div style={{ width: 38 }} />
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-item ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>Penjualan</button>
        <button className={`tab-item ${activeTab === 'clinical' ? 'active' : ''}`} onClick={() => setActiveTab('clinical')}>Klinis</button>
        <button className={`tab-item ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>Stok</button>
      </div>

      {isLoading ? (
        <div className="loading-center">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span>Memproses data laporan...</span>
        </div>
      ) : (
        <div style={{ padding: '1rem' }}>
          {/* TAB 1: PENJUALAN */}
          {activeTab === 'sales' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Beautiful Area Chart */}
              <div className="card" style={{ height: '220px', padding: '0.75rem' }}>
                <span className="section-title" style={{ fontSize: '0.75rem', marginBottom: '8px', display: 'block' }}>TREN PENDAPATAN (7 HARI TERAKHIR)</span>
                <ResponsiveContainer width="100%" height="90%">
                  <AreaChart data={salesData.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => [rp(Number(value)), 'Revenue']} labelStyle={{ fontSize: '11px', fontWeight: 'bold' }} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stats Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}><TrendingUp size={18} /></div>
                  <div>
                    <div className="stat-value" style={{ fontSize: '1.0625rem' }}>{rp(salesData.revenue)}</div>
                    <div className="stat-label">Total Omset</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}><Users size={18} /></div>
                  <div>
                    <div className="stat-value" style={{ fontSize: '1.0625rem' }}>{salesData.orderCount} Order</div>
                    <div className="stat-label">Rata-rata: {rp(salesData.avgTicket)}</div>
                  </div>
                </div>
              </div>

              {/* Best Selling Products */}
              <div className="card">
                <span className="section-title" style={{ fontSize: '0.8125rem', marginBottom: '8px', display: 'block' }}>🥇 TOP 5 PRODUK TERLARIS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.5rem' }}>
                  {salesData.topItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ width: '18px', height: '18px', background: 'var(--bg)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 800 }}>{idx + 1}</span>
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                      </div>
                      <span className="badge badge-blue">{item.qty} Pcs</span>
                    </div>
                  ))}
                  {salesData.topItems.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada data barang terlaris.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KLINIS */}
          {activeTab === 'clinical' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}><Activity size={18} /></div>
                <div>
                  <div className="stat-value">{clinicalData.totalExams} Pemeriksaan</div>
                  <div className="stat-label">Total catatan medis klinis terdata</div>
                </div>
              </div>

              <div className="card">
                <span className="section-title" style={{ fontSize: '0.8125rem', marginBottom: '8px', display: 'block' }}>DISTRIBUSI SUMBER RESEP</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '0.5rem', textAlign: 'center' }}>
                  <div style={{ background: 'var(--primary-light)', padding: '12px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{clinicalData.internalCount}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>Optik Internal</span>
                  </div>
                  <div style={{ background: 'var(--warning-light)', padding: '12px', borderRadius: '12px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)' }}>{clinicalData.externalCount}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>Rujukan Resep Luar</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <span className="section-title" style={{ fontSize: '0.8125rem', marginBottom: '8px', display: 'block' }}>TIPE LENSA DARI RUJUKAN LUAR</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.5rem' }}>
                  {clinicalData.lensTypes.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{item.name}</span>
                      <span className="badge badge-yellow">{item.qty} Kali</span>
                    </div>
                  ))}
                  {clinicalData.lensTypes.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada rujukan resep luar tercatat.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STOK & INVENTORI VALUATION */}
          {activeTab === 'stock' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}><Package size={18} /></div>
                <div>
                  <div className="stat-value">{rp(stockData.totalValuation)}</div>
                  <div className="stat-label">Total Nilai Aset Inventori (Harga Beli)</div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <AlertTriangle className="text-warning" size={16} />
                  <span className="section-title" style={{ fontSize: '0.8125rem' }}>BARANG STOK MENIPIS / HABIS ({stockData.lowStock.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.5rem' }}>
                  {stockData.lowStock.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                      <div>
                        <span style={{ fontWeight: 600, display: 'block' }}>{item.name}</span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>SKU: {item.sku}</span>
                      </div>
                      <span className={`badge ${item.stock <= 0 ? 'badge-red' : 'badge-yellow'}`}>Stok: {item.stock}</span>
                    </div>
                  ))}
                  {stockData.lowStock.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--success)', fontWeight: 600 }}>Stok seluruh barang dalam kondisi aman.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
