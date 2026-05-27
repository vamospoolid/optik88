import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, DollarSign, X, ChevronRight, Loader2 } from 'lucide-react';
import { transactionsService, patientsService } from '../services/api';

const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Transaction() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initStatus = searchParams.get('status') || 'ALL';
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>(initStatus);

  // Queries
  const { data: transactions = [], isLoading: isLoadingTrx } = useQuery<any[]>({
    queryKey: ['transactions'],
    queryFn: transactionsService.getAll,
  });

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ['patients'],
    queryFn: patientsService.getAll,
  });

  const filterChips = [
    { id: 'ALL', label: 'Semua' },
    { id: 'pending', label: 'Pending' },
    { id: 'diproses', label: 'Diproses' },
    { id: 'siap', label: 'Siap Ambil' },
    { id: 'selesai', label: 'Selesai' },
    { id: 'lunas', label: 'Lunas' },
    { id: 'dp', label: 'Uang Muka (DP)' }
  ];

  // Filtering transactions logic
  const filteredTrx = transactions.filter(t => {
    const patient = patients.find(p => p.id === t.patient_id);
    const patientName = patient ? patient.name.toLowerCase() : 'umum';
    const matchSearch = t.invoice_number.toLowerCase().includes(search.toLowerCase()) || patientName.includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'lunas' || filterStatus === 'dp') {
      return t.payment_status === filterStatus;
    }
    return t.order_status === filterStatus;
  });

  return (
    <div className="page-scroll animate-fade-in" style={{ paddingBottom: '6rem' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <span className="top-bar-title">Daftar Transaksi</span>
        <button className="top-bar-action" onClick={() => navigate('/order/baru')}>
          <Plus size={20} />
        </button>
      </div>

      {/* Sticky Search Box */}
      <div className="search-bar" style={{ marginBottom: '0.75rem' }}>
        <Search size={18} className="text-secondary" />
        <input
          type="text"
          placeholder="Cari Invoice atau Nama Pasien..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button style={{ border: 'none', background: 'transparent' }} onClick={() => setSearch('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter status row (horizontal scroll) */}
      <div className="chip-row" style={{ marginBottom: '1rem' }}>
        {filterChips.map(chip => (
          <button
            key={chip.id}
            className={`chip ${filterStatus === chip.id ? 'active' : ''}`}
            onClick={() => setFilterStatus(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Transactions list */}
      <div className="card-list" style={{ padding: '0 1rem' }}>
        {isLoadingTrx ? (
          <div className="loading-center">
            <Loader2 size={32} className="animate-spin text-primary" />
            <span>Memuat data transaksi...</span>
          </div>
        ) : filteredTrx.length === 0 ? (
          <div className="empty-state card">
            <h3>Transaksi Tidak Ditemukan</h3>
            <p>Tidak ada invoice yang cocok dengan kriteria filter.</p>
          </div>
        ) : (
          filteredTrx.map((trx: any) => {
            const patient = patients.find(p => p.id === trx.patient_id);
            return (
              <div
                key={trx.id}
                className="list-item ripple"
                onClick={() => navigate(`/transaksi/${trx.id}`)}
                style={{ padding: '1rem' }}
              >
                <div className="list-item-avatar" style={{ background: trx.payment_status === 'lunas' ? 'var(--success)' : 'var(--warning)' }}>
                  <DollarSign size={20} />
                </div>
                <div className="list-item-content">
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800 }}>{trx.invoice_number}</span>
                    <span className={`badge ${
                      trx.order_status === 'selesai' ? 'badge-green' :
                      trx.order_status === 'siap' ? 'badge-cyan' :
                      trx.order_status === 'diproses' ? 'badge-blue' : 'badge-yellow'
                    }`} style={{ fontSize: '0.5625rem', padding: '2px 6px' }}>
                      {trx.order_status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Pasien: <strong>{patient?.name || 'Umum'}</strong>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {new Date(trx.created_at).toLocaleDateString('id-ID')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {rp(trx.total_amount)}
                  </div>
                  <span className={`badge ${trx.payment_status === 'lunas' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.5625rem', padding: '2px 6px' }}>
                    {trx.payment_status?.toUpperCase()}
                  </span>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginLeft: '4px' }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
