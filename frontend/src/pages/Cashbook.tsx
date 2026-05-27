import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashflowService } from '../services/api';
import { ArrowDownRight, ArrowUpRight, Plus, Loader2, RefreshCw, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Cashbook.css';

const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const Cashbook: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME' | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    notes: ''
  });

  const { data: summary, isLoading: loadSummary, isFetching: fetchSummary } = useQuery({
    queryKey: ['cashflow_summary'],
    queryFn: cashflowService.getTodaySummary,
  });

  const { data: records, isLoading: loadRecords, isFetching: fetchRecords } = useQuery({
    queryKey: ['cashflow_records'],
    queryFn: cashflowService.getTodayRecords,
  });

  const createMutation = useMutation({
    mutationFn: cashflowService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashflow_summary'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow_records'] });
      setActiveTab(null);
      setFormData({ amount: '', category: '', notes: '' });
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['cashflow_summary'] });
    queryClient.invalidateQueries({ queryKey: ['cashflow_records'] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTab || !formData.amount || !formData.category) return;

    createMutation.mutate({
      type: activeTab,
      amount: Number(formData.amount),
      category: formData.category,
      notes: formData.notes,
      created_by: user?.name || 'Kasir',
    });
  };

  return (
    <div className="cashbook-page">
      <div className="cb-hero">
        <div className="cb-hero-left">
          <div className="cb-hero-header">
            <div className="cb-hero-icon">
              <Wallet size={32} color="#ffffff" />
            </div>
            <div className="cb-hero-title" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h1>Buku Kas & Arus Kas</h1>
                <p>Rekapitulasi uang fisik laci kasir hari ini.</p>
              </div>
              <button 
                className="btn btn-secondary btn-icon" 
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} 
                onClick={handleRefresh}
              >
                <RefreshCw size={14} className={fetchSummary || fetchRecords ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
          <div className="cb-net-balance">
            <div className="label">Total Uang Fisik (Laci Kasir)</div>
            <div className="amount">{rp(summary?.net_balance || 0)}</div>
          </div>
        </div>

        <div className="cb-hero-right">
          <div className="cb-stat">
            <span className="cb-stat-num text-emerald">{rp(summary?.total_auto_income || 0)}</span>
            <span className="cb-stat-label">Penjualan (Auto)</span>
          </div>
          <div className="cb-stat-div" />
          <div className="cb-stat">
            <span className="cb-stat-num text-indigo">{rp(summary?.total_manual_income || 0)}</span>
            <span className="cb-stat-label">Uang Ekstra</span>
          </div>
          <div className="cb-stat-div" />
          <div className="cb-stat">
            <span className="cb-stat-num text-rose">{rp(summary?.total_expense || 0)}</span>
            <span className="cb-stat-label">Pengeluaran</span>
          </div>
        </div>
      </div>

      <div className="action-buttons-row">
        <button 
          className={`btn-action btn-expense ${activeTab === 'EXPENSE' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'EXPENSE' ? null : 'EXPENSE')}
        >
          <ArrowUpRight size={20} />
          Catat Pengeluaran Laci
        </button>
        <button 
          className={`btn-action btn-income ${activeTab === 'INCOME' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'INCOME' ? null : 'INCOME')}
        >
          <ArrowDownRight size={20} />
          Catat Pemasukan Ekstra
        </button>
      </div>

      {activeTab && (
        <div className={`cashflow-form-card animate-fade-in ${activeTab.toLowerCase()}`}>
          <div className="cf-form-header">
            <h3>{activeTab === 'EXPENSE' ? 'Pengeluaran Uang Fisik' : 'Pemasukan Uang Ekstra (Non-Transaksi)'}</h3>
            <button className="btn-close-form" onClick={() => setActiveTab(null)}>&times;</button>
          </div>
          <form onSubmit={handleSubmit} className="cf-form-body">
            <div className="field-row">
              <div className="form-group flex-1">
                <label>Kategori *</label>
                {activeTab === 'EXPENSE' ? (
                  <select 
                    className="form-control" 
                    value={formData.category} 
                    onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                    required
                  >
                    <option value="">Pilih Kategori...</option>
                    <option value="Operasional">Operasional Toko (Air Galon, Listrik, Kebersihan)</option>
                    <option value="Konsumsi">Konsumsi Karyawan</option>
                    <option value="Biaya Lab/Kurir">Biaya Lab Potong Lensa / Kurir / Paket</option>
                    <option value="Perlengkapan">ATK / Lakban / Kertas Struk</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                ) : (
                  <select 
                    className="form-control" 
                    value={formData.category} 
                    onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                    required
                  >
                    <option value="">Pilih Kategori...</option>
                    <option value="Modal Awal">Modal Awal / Kembalian Kasir</option>
                    <option value="Penjualan Lain">Penjualan Aksesoris Bekas / Limbah</option>
                    <option value="Lainnya">Suntikan Kas Lainnya</option>
                  </select>
                )}
              </div>
              <div className="form-group flex-1">
                <label>Nominal (Rp) *</label>
                <div className="input-group">
                  <span className="input-addon">Rp</span>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={formData.amount}
                    onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                    required 
                  />
                </div>
              </div>
            </div>
            <div className="form-group mt-3">
              <label>Keterangan Tambahan / Catatan</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Contoh: Beli teh pucuk 2 botol, Beli lakban bening" 
                value={formData.notes}
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                required
              />
            </div>
            <div className="form-actions mt-4">
              <button 
                type="submit" 
                className={`btn w-full ${activeTab === 'EXPENSE' ? 'btn-danger' : 'btn-success'}`}
                disabled={createMutation.isPending || !formData.amount || !formData.category}
              >
                {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Simpan Transaksi Kas
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="history-section mt-4">
        <h3 className="section-title">Riwayat Input Manual Hari Ini</h3>
        {loadRecords ? (
          <div className="loading-card"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : !records || records.length === 0 ? (
          <div className="empty-state-sm">
            <p>Belum ada pencatatan kas manual hari ini.</p>
          </div>
        ) : (
          <div className="records-list">
            {records.map(rec => (
              <div key={rec.id} className="record-item">
                <div className={`record-icon ${rec.type.toLowerCase()}`}>
                  {rec.type === 'INCOME' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div className="record-details">
                  <div className="record-top">
                    <span className="record-cat">{rec.category}</span>
                    <span className={`record-amount ${rec.type.toLowerCase()}`}>
                      {rec.type === 'INCOME' ? '+' : '-'} {rp(rec.amount)}
                    </span>
                  </div>
                  <div className="record-bottom">
                    <span className="record-notes">{rec.notes}</span>
                    <span className="record-time">
                      {new Date(rec.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • oleh {rec.created_by}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cashbook;
