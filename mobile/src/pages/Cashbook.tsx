import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, X, ArrowUpRight, ArrowDownLeft, Calendar, Loader2,
  ShoppingCart, TrendingUp, TrendingDown, Wallet, RefreshCw
} from 'lucide-react';
import { cashbookService } from '../services/api';

const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const TABS = [
  { id: 'daily', label: 'Hari Ini' },
  { id: 'weekly', label: '7 Hari' },
  { id: 'monthly', label: 'Bulan Ini' },
] as const;

type PeriodType = 'daily' | 'weekly' | 'monthly';

export default function Cashbook() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PeriodType>('daily');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterSource, setFilterSource] = useState<'all' | 'pos' | 'manual'>('all');

  // Form State
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [category, setCategory] = useState<string>('Modal Awal');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Queries
  const { data: cashbookItems = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['cashbook', activeTab],
    queryFn: () => cashbookService.getAll(activeTab),
    staleTime: 30_000,
  });

  const { data: summary } = useQuery<any>({
    queryKey: ['cashbook-summary'],
    queryFn: cashbookService.getSummary,
    staleTime: 30_000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: cashbookService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashbook'] });
      queryClient.invalidateQueries({ queryKey: ['cashbook-summary'] });
      handleCloseForm();
    },
  });

  const handleCloseForm = () => {
    setShowAddForm(false);
    setType('INCOME');
    setCategory('Modal Awal');
    setAmount('');
    setNotes('');
  };

  const openForm = (preset: 'INCOME' | 'EXPENSE') => {
    setType(preset);
    setCategory(preset === 'INCOME' ? 'Modal Awal' : 'Operasional');
    setAmount('');
    setNotes('');
    setShowAddForm(true);
  };

  const handleTypeChange = (newType: 'INCOME' | 'EXPENSE') => {
    setType(newType);
    setCategory(newType === 'INCOME' ? 'Modal Awal' : 'Operasional');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val <= 0 || !category || !notes.trim()) return;
    createMutation.mutate({ type, category, amount: val, notes: notes.trim() });
  };

  // Compute stats from cashbookItems
  const { filteredItems, totalIncome, totalExpense, netBalance } = useMemo(() => {
    const source = filterSource;
    const items = source === 'all'
      ? cashbookItems
      : cashbookItems.filter(i => i.source === source);

    let income = 0;
    let expense = 0;
    items.forEach(item => {
      const t = (item.type || '').toUpperCase();
      if (t === 'INCOME') income += item.amount;
      else if (t === 'EXPENSE') expense += item.amount;
    });

    return {
      filteredItems: items,
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
    };
  }, [cashbookItems, filterSource]);

  const isPos = (item: any) => item.source === 'pos';

  return (
    <div className="page-scroll animate-fade-in" style={{ paddingBottom: '7rem' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <span className="top-bar-title">Buku Kas</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="top-bar-action"
            onClick={() => { refetch(); queryClient.invalidateQueries({ queryKey: ['cashbook-summary'] }); }}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button className="top-bar-action" onClick={() => setShowAddForm(true)}>
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Hero Stats Header */}
      <div
        className="hero-header"
        style={{ borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px', padding: '1.25rem 1rem 1.75rem 1rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Wallet size={14} /> TOTAL SALDO BERSIH
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px', color: netBalance >= 0 ? '#10B981' : '#F87171' }}>
          {rp(netBalance)}
        </h2>
        <p style={{ fontSize: '0.6875rem', opacity: 0.7, marginTop: '2px' }}>
          {activeTab === 'daily' ? 'Rekap hari ini' : activeTab === 'weekly' ? '7 hari terakhir' : 'Bulan ini'}
          {summary && ` • Otomatis dari POS: ${rp(summary.total_auto_income)}`}
        </p>

        {/* 2-col stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)', display: 'block', fontWeight: 600 }}>KAS MASUK</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
              <TrendingUp size={14} /> {rp(totalIncome)}
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)', display: 'block', fontWeight: 600 }}>KAS KELUAR</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#F87171', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
              <TrendingDown size={14} /> {rp(totalExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Quick Entry Buttons ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem 1rem 0' }}>
        <button
          className="ripple"
          onClick={() => openForm('INCOME')}
          style={{
            background: '#ECFDF5',
            border: '1.5px solid #A7F3D0',
            borderRadius: '16px',
            padding: '0.875rem 1rem',
            display: 'flex', alignItems: 'center', gap: '10px',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(16,185,129,0.12)',
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: '12px',
            background: 'linear-gradient(135deg, #059669, #10B981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 3px 10px rgba(16,185,129,0.35)',
          }}>
            <TrendingUp size={18} color="white" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065F46' }}>+ Pemasukan</div>
            <div style={{ fontSize: '0.6rem', color: '#6B7280', marginTop: '1px' }}>Catat kas masuk</div>
          </div>
        </button>

        <button
          className="ripple"
          onClick={() => openForm('EXPENSE')}
          style={{
            background: '#FEF2F2',
            border: '1.5px solid #FECACA',
            borderRadius: '16px',
            padding: '0.875rem 1rem',
            display: 'flex', alignItems: 'center', gap: '10px',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(239,68,68,0.10)',
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: '12px',
            background: 'linear-gradient(135deg, #DC2626, #EF4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 3px 10px rgba(239,68,68,0.30)',
          }}>
            <TrendingDown size={18} color="white" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991B1B' }}>− Pengeluaran</div>
            <div style={{ fontSize: '0.6rem', color: '#6B7280', marginTop: '1px' }}>Catat kas keluar</div>
          </div>
        </button>
      </div>

      {/* Period tabs */}
      <div className="tab-bar" style={{ marginTop: '1rem' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Source filter chips */}
      <div className="chip-row" style={{ padding: '0 1rem', margin: '0.5rem 0' }}>
        {[
          { id: 'all', label: 'Semua' },
          { id: 'pos', label: '🛒 Transaksi POS' },
          { id: 'manual', label: '✏️ Manual' },
        ].map(f => (
          <button
            key={f.id}
            className={`chip ${filterSource === f.id ? 'active' : ''}`}
            onClick={() => setFilterSource(f.id as any)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Ledger List */}
      <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '2rem' }}>
        {isLoading ? (
          <div className="loading-center">
            <Loader2 size={32} className="animate-spin text-primary" />
            <span>Memuat buku kas...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state card">
            <h3>Belum Ada Catatan Kas</h3>
            <p>Tidak ada pemasukan atau pengeluaran kas tercatat pada periode ini.</p>
            <button className="btn btn-primary ripple" style={{ marginTop: '0.75rem' }} onClick={() => setShowAddForm(true)}>
              <Plus size={16} /> Catat Kas Manual
            </button>
          </div>
        ) : (
          filteredItems.map(item => {
            const tUp = (item.type || '').toUpperCase();
            const isIncome = tUp === 'INCOME';
            const isPosEntry = isPos(item);
            return (
              <div
                key={item.id}
                className="list-item"
                style={{
                  padding: '0.75rem 1rem',
                  borderLeft: isPosEntry ? '3px solid var(--primary)' : isIncome ? '3px solid var(--success)' : '3px solid var(--danger)',
                  borderRadius: '14px',
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: isPosEntry ? 'var(--primary-light)' : isIncome ? 'var(--success-light)' : 'var(--danger-light)',
                  color: isPosEntry ? 'var(--primary)' : isIncome ? 'var(--success)' : 'var(--danger)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {isPosEntry ? <ShoppingCart size={18} /> : isIncome ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                </div>

                {/* Content */}
                <div className="list-item-content">
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.notes}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                    <Calendar size={10} />
                    <span>{new Date(item.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    {isPosEntry ? (
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '6px', fontSize: '0.5625rem', fontWeight: 700 }}>POS</span>
                    ) : (
                      <span style={{ background: 'var(--border)', color: 'var(--text-secondary)', padding: '1px 6px', borderRadius: '6px', fontSize: '0.5625rem', fontWeight: 700 }}>{item.category || 'Manual'}</span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: isIncome ? 'var(--success)' : 'var(--danger)' }}>
                    {isIncome ? '+' : '-'}{rp(item.amount)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setShowAddForm(true)} aria-label="Catat Kas">
        <Plus size={24} />
      </button>

      {/* Add Cashbook Entry Bottom Sheet */}
      {showAddForm && (
        <>
          <div className="sheet-backdrop" onClick={handleCloseForm} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <span className="sheet-title">Catat Transaksi Kas Manual</span>
              <button className="sheet-close" onClick={handleCloseForm}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="sheet-body">
                {/* Type selector */}
                <div className="form-group">
                  <label className="form-label">Jenis Transaksi</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      style={{
                        padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                        background: type === 'INCOME' ? 'var(--success)' : 'var(--bg)',
                        color: type === 'INCOME' ? 'white' : 'var(--text-secondary)',
                        boxShadow: type === 'INCOME' ? 'var(--shadow-md)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                      onClick={() => handleTypeChange('INCOME')}
                    >
                      <TrendingUp size={16} /> Pemasukan
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                        background: type === 'EXPENSE' ? 'var(--danger)' : 'var(--bg)',
                        color: type === 'EXPENSE' ? 'white' : 'var(--text-secondary)',
                        boxShadow: type === 'EXPENSE' ? 'var(--shadow-md)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                      onClick={() => handleTypeChange('EXPENSE')}
                    >
                      <TrendingDown size={16} /> Pengeluaran
                    </button>
                  </div>
                </div>

                {/* Category select drop-down */}
                <div className="form-group">
                  <label className="form-label">Kategori Transaksi *</label>
                  {type === 'EXPENSE' ? (
                    <select
                      className="form-control"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      required
                    >
                      <option value="Operasional">Operasional Toko (Air Galon, Listrik, Kebersihan)</option>
                      <option value="Konsumsi">Konsumsi Karyawan</option>
                      <option value="Biaya Lab/Kurir">Biaya Lab Potong Lensa / Kurir / Paket</option>
                      <option value="Perlengkapan">ATK / Lakban / Kertas Struk</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  ) : (
                    <select
                      className="form-control"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      required
                    >
                      <option value="Modal Awal">Modal Awal / Kembalian Kasir</option>
                      <option value="Penjualan Lain">Penjualan Aksesoris Bekas / Limbah</option>
                      <option value="Lainnya">Suntikan Kas Lainnya</option>
                    </select>
                  )}
                </div>

                {/* Amount */}
                <div className="form-group">
                  <label className="form-label">Nominal (Rp) *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Contoh: 150000"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    min="1"
                  />
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">Keterangan *</label>
                  <textarea
                    className="form-control"
                    placeholder="Contoh: Beli kertas printer thermal, bayar listrik, dll..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    required
                    rows={3}
                  />
                </div>

                <div style={{
                  background: type === 'INCOME' ? 'var(--success-light)' : 'var(--danger-light)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: type === 'INCOME' ? 'var(--success)' : 'var(--danger)',
                  marginBottom: '0.5rem'
                }}>
                  {type === 'INCOME' ? '↑ Menambah saldo kas' : '↓ Mengurangi saldo kas'}
                  {amount && parseFloat(amount) > 0 && ` sebesar ${rp(parseFloat(amount))}`}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full ripple"
                  style={{ height: '48px' }}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                  ) : (
                    'Simpan Transaksi Kas'
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
