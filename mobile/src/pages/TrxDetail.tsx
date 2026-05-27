import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Loader2, Calendar, User, Printer, Check, X, RefreshCw, MessageSquare
} from 'lucide-react';
import { transactionsService, patientsService } from '../services/api';

const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function TrxDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const formatPhoneForWa = (phone?: string) => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return cleaned;
  };

  const generateWaInvoiceMessage = (trx: any, patientName: string) => {
    const itemsText = (trx.items || []).map((item: any) => 
      `• ${item.name} (${item.qty}x) - ${rp(item.sell_price)}`
    ).join('\n');

    const text = 
`*INVOICE TRANSAKSI - OPTIK 88*

Halo Kak *${patientName}*, berikut adalah rincian invoice transaksi Anda:

*No. Invoice:* ${trx.invoice_number}
*Tanggal:* ${new Date(trx.created_at).toLocaleDateString('id-ID')}
*Status Pesanan:* ${trx.order_status?.toUpperCase()}

*Rincian Belanja:*
${itemsText}

*Subtotal:* ${rp(trx.total_amount + (trx.discount || 0))}
*Diskon:* ${rp(trx.discount || 0)}
*Total Akhir:* ${rp(trx.total_amount)}

*Detail Pembayaran:*
*Sudah Dibayar:* ${rp(trx.paid_amount)}
*Sisa Pembayaran (Piutang):* ${rp(trx.remaining_amount)}
*Status Bayar:* ${trx.payment_status?.toUpperCase()}
*Metode:* ${trx.payment_method?.toUpperCase()}

Terima kasih telah memercayakan kesehatan mata Anda di *Optik 88*. Semoga sehat selalu! 😊`;

    return encodeURIComponent(text);
  };

  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer' | 'debit' | 'credit'>('cash');

  const mapPayMethod = (m: string) => ({ cash: 'tunai', transfer: 'transfer', debit: 'debit', credit: 'kredit' }[m] || 'tunai');

  // Queries
  const { data: transaction, isLoading: isLoadingTrx } = useQuery<any>({
    queryKey: ['transaction', id],
    queryFn: () => transactionsService.getById(id!),
    enabled: !!id,
  });

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ['patients'],
    queryFn: patientsService.getAll,
  });

  const patient = useMemo(() => {
    if (!transaction) return null;
    return patients.find(p => p.id === transaction.patient_id);
  }, [transaction, patients]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, paidAmount, paymentMethod }: { status?: string, paidAmount?: number, paymentMethod?: string }) =>
      transactionsService.updateStatus(id!, { order_status: status, paid_amount: paidAmount, payment_method: paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cashbook'] });
      setShowPayForm(false);
      setPayAmount('');
    },
  });

  if (isLoadingTrx) {
    return (
      <div className="loading-center">
        <Loader2 size={32} className="animate-spin text-primary" />
        <span>Memuat detail transaksi...</span>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="empty-state card" style={{ margin: '2rem' }}>
        <h3>Transaksi Tidak Ditemukan</h3>
        <button className="btn btn-primary" onClick={() => navigate('/transaksi')}>Kembali Ke List</button>
      </div>
    );
  }

  const sisaPiutang = Math.max(0, transaction.total_amount - transaction.paid_amount);

  const getNextStatus = (current: string) => {
    if (current === 'pending') return 'diproses';
    if (current === 'diproses') return 'siap';
    if (current === 'siap') return 'selesai';
    return null;
  };

  const nextStatus = getNextStatus(transaction.order_status);

  const handleUpdateStatus = () => {
    if (!nextStatus) return;
    updateStatusMutation.mutate({ status: nextStatus });
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payAmount) || 0;
    if (amount <= 0) return;

    updateStatusMutation.mutate({
      paidAmount: transaction.paid_amount + amount,
      paymentMethod: mapPayMethod(payMethod),
    });
  };

  return (
    <div className="page-scroll animate-fade-in" style={{ paddingBottom: '6rem' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <button
          style={{ border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => navigate('/transaksi')}
        >
          <ArrowLeft size={20} className="text-primary" />
        </button>
        <span className="top-bar-title">Invoice Detail</span>
        <button
          style={{ border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => alert('Fitur cetak terhubung ke printer Bluetooth melalui Settings.')}
        >
          <Printer size={18} className="text-secondary" />
        </button>
      </div>

      {/* Invoice Overview Card */}
      <div className="card" style={{ margin: '1rem', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>{transaction.invoice_number}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              <Calendar size={12} />
              <span>{new Date(transaction.created_at).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
          <span className={`badge ${transaction.payment_status === 'lunas' ? 'badge-green' : 'badge-yellow'}`}>
            {transaction.payment_status?.toUpperCase()}
          </span>
        </div>

        <div className="divider" />

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{patient?.name || 'Umum'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No. HP: {patient?.phone || '—'}</div>
          </div>
        </div>
      </div>

      {/* Stepper Progress Card */}
      <div className="card" style={{ margin: '0 1rem 1rem 1rem', border: '1px solid var(--border)' }}>
        <span className="section-title" style={{ fontSize: '0.8125rem' }}>STATUS PENGERJAAN ORDER</span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'diproses', label: 'Diproses' },
            { id: 'siap', label: 'Siap Ambil' },
            { id: 'selesai', label: 'Selesai' }
          ].map((st, index, arr) => {
            const isCompleted = arr.findIndex(x => x.id === transaction.order_status) >= index;
            const isActive = transaction.order_status === st.id;
            return (
              <div key={st.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: isCompleted ? 'var(--success)' : 'var(--bg)',
                  border: isActive ? '2px solid var(--primary)' : '2px solid var(--border)',
                  color: isCompleted ? 'white' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.625rem', fontWeight: 700, zIndex: 5
                }}>
                  {isCompleted ? <Check size={12} /> : index + 1}
                </div>
                <span style={{ fontSize: '0.625rem', fontWeight: 600, color: isActive ? 'var(--primary)' : 'var(--text-secondary)', marginTop: '4px', textAlign: 'center' }}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="card" style={{ margin: '0 1rem 1rem 1rem', border: '1px solid var(--border)' }}>
        <span className="section-title" style={{ fontSize: '0.8125rem' }}>DAFTAR ITEM BELANJA</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
          {transaction.items?.map((item: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{item.name}</div>
                <span className="badge badge-gray" style={{ fontSize: '0.5625rem', marginTop: '2px' }}>
                  {item.product_type?.toUpperCase()}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{rp(item.sell_price)}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Qty: {item.qty}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Breakdown Card */}
      <div className="card" style={{ margin: '0 1rem 1.5rem 1rem', border: '1px solid var(--border)' }}>
        <span className="section-title" style={{ fontSize: '0.8125rem' }}>RINCIAN TAGIHAN</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>{rp(transaction.total_amount + (transaction.discount || 0))}</span>
          </div>
          {transaction.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
              <span>Potongan Diskon:</span>
              <span>-{rp(transaction.discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            <span>Total Tagihan Net:</span>
            <span>{rp(transaction.total_amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: 600 }}>
            <span>Sudah Dibayar ({transaction.payment_method?.toUpperCase()}):</span>
            <span>{rp(transaction.paid_amount)}</span>
          </div>
          <div className="divider" style={{ margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.9375rem', color: sisaPiutang > 0 ? 'var(--warning)' : 'var(--success)' }}>
            <span>{sisaPiutang > 0 ? 'Sisa Piutang (DP):' : 'Status Tagihan:'}</span>
            <span>{sisaPiutang > 0 ? rp(sisaPiutang) : 'LUNAS'}</span>
          </div>
        </div>
      </div>

      {/* CTA Operations */}
      <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {nextStatus && (
          <button
            type="button"
            className="btn btn-primary btn-full ripple"
            onClick={handleUpdateStatus}
            disabled={updateStatusMutation.isPending}
            style={{ height: '48px' }}
          >
            {updateStatusMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <RefreshCw size={16} />
                Maju Ke Status: {nextStatus.toUpperCase()}
              </>
            )}
          </button>
        )}

        {sisaPiutang > 0 && (
          <button
            type="button"
            className="btn btn-secondary btn-full ripple"
            onClick={() => setShowPayForm(true)}
            style={{ height: '48px' }}
          >
            💵 Catat Pembayaran Pelunasan
          </button>
        )}

        <button
          type="button"
          className="btn btn-full ripple"
          style={{
            height: '48px',
            background: '#25D366',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontSize: '0.875rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
            transition: 'transform 0.1s'
          }}
          onClick={() => {
            const waPhone = formatPhoneForWa(patient?.phone);
            if (!waPhone) {
              alert('Nomor HP pasien belum terisi atau tidak valid!');
              return;
            }
            const waMsg = generateWaInvoiceMessage(transaction, patient?.name || 'Pelanggan');
            window.open(`https://wa.me/${waPhone}?text=${waMsg}`, '_blank');
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageSquare size={18} />
          <span>Kirim Invoice (WhatsApp)</span>
        </button>
      </div>

      {/* Add Payment Modal Bottom Sheet */}
      {showPayForm && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowPayForm(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <span className="sheet-title">Catat Pelunasan Pembayaran</span>
              <button className="sheet-close" onClick={() => setShowPayForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddPayment}>
              <div className="sheet-body">
                <div style={{ background: 'var(--warning-light)', padding: '10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning)' }}>
                  Sisa tagihan yang harus dibayar: <strong>{rp(sisaPiutang)}</strong>
                </div>

                <div className="form-group">
                  <label className="form-label">Metode Pembayaran</label>
                  <select className="form-control" value={payMethod} onChange={e => setPayMethod(e.target.value as any)}>
                    <option value="cash">Cash / Tunai</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="debit">Kartu Debit</option>
                    <option value="credit">Kartu Kredit</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nominal Pembayaran Tambahan (Rp) *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Contoh: 100000"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    max={sisaPiutang}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full ripple"
                  style={{ marginTop: '0.75rem', height: '48px' }}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Simpan Pembayaran'
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
