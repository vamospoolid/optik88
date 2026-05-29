import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Printer, CheckCircle, Clock, Package, XCircle,
  ShoppingCart, Wrench, Glasses, CreditCard, Banknote, ArrowRight,
  Loader2, Receipt, User, Calendar, ChevronDown, ChevronRight, MessageCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService, patientsService } from '../services/api';
import type { Transaction, Patient } from 'optik88-shared';
import InvoiceModal from '../components/InvoiceModal';
import './Transaction.css';

interface TrxItem {
  id: string;
  name: string;
  product_type: 'frame' | 'lens' | 'service';
  qty: number;
  sell_price: number;
  original_price: number;
  subtotal: number;
}

const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

type OrderStatus = 'pending' | 'diproses' | 'siap' | 'selesai' | 'dibatalkan';
type PaymentStatus = 'belum_bayar' | 'dp' | 'lunas';

const orderStatusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  pending:    { label: 'Pending',    color: '#d97706', bg: '#fef3c7', icon: <Clock size={12} /> },
  diproses:   { label: 'Diproses',  color: '#4f46e5', bg: '#ede9fe', icon: <Package size={12} /> },
  siap:       { label: 'Siap',      color: '#0891b2', bg: '#cffafe', icon: <CheckCircle size={12} /> },
  selesai:    { label: 'Selesai',   color: '#059669', bg: '#d1fae5', icon: <CheckCircle size={12} /> },
  dibatalkan: { label: 'Dibatalkan',color: '#dc2626', bg: '#fee2e2', icon: <XCircle size={12} /> },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  belum_bayar: { label: 'Belum Bayar', color: '#dc2626', bg: '#fee2e2' },
  dp:          { label: 'Down Payment',color: '#d97706', bg: '#fef3c7' },
  lunas:       { label: 'Lunas',       color: '#059669', bg: '#d1fae5' },
};

const ORDER_FLOW: OrderStatus[] = ['pending', 'diproses', 'siap', 'selesai'];
const ORDER_FLOW_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending', diproses: 'Diproses', siap: 'Siap Ambil', selesai: 'Selesai', dibatalkan: 'Dibatalkan'
};

const productTypeConfig = {
  frame:   { label: 'Frame',  icon: <Glasses size={13} />,      color: '#4f46e5', bg: '#ede9fe' },
  lens:    { label: 'Lensa',  icon: <Package size={13} />,      color: '#0891b2', bg: '#cffafe' },
  service: { label: 'Jasa',   icon: <Wrench size={13} />,       color: '#d97706', bg: '#fef3c7' },
};

const TransactionPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTrxId, setSelectedTrxId] = useState<string | null>(null);
  const [invoiceTrx, setInvoiceTrx] = useState<Transaction | null>(null);

  const { data: transactions = [], isLoading: loadTrx, isError: errTrx } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: transactionsService.getAll,
  });

  const { data: patients = [], isLoading: loadPatients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: patientsService.getAll,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Record<string, unknown> }) => transactionsService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const isLoading = loadTrx || loadPatients;

  const filtered = transactions
    .filter(t => {
      const patient = patients.find(p => p.id === t.patient_id);
      const matchSearch =
        t.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        (patient?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchStatus = filterStatus === 'all' || t.payment_status === filterStatus || t.order_status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Stats
  const totalRevenue = transactions.filter(t => t.payment_status === 'lunas').reduce((s, t) => s + t.total_amount, 0);
  const pendingCount = transactions.filter(t => t.order_status === 'pending' || t.order_status === 'diproses').length;
  const dpCount = transactions.filter(t => t.payment_status === 'dp').length;

  const advanceStatus = async (trx: Transaction) => {
    const idx = ORDER_FLOW.indexOf(trx.order_status as OrderStatus);
    if (idx < 0 || idx >= ORDER_FLOW.length - 1) return;
    const nextStatus = ORDER_FLOW[idx + 1];
    await updateStatusMutation.mutateAsync({
      id: trx.id,
      status: { order_status: nextStatus, ...(nextStatus === 'selesai' && trx.remaining_amount === 0 ? { payment_status: 'lunas' } : {}) },
    });
  };

  const recordPayment = async (trx: Transaction, amount: number, method: string) => {
    await updateStatusMutation.mutateAsync({ id: trx.id, status: { paid_amount: amount, payment_method: method } });
  };

  return (
    <div className="trx-page animate-fade-in">

      {/* ── Hero ── */}
      <div className="trx-hero">
        <div className="trx-hero-left">
          <div className="trx-hero-icon"><Receipt size={26} /></div>
          <div>
            <h1>Manajemen Transaksi</h1>
            <p>Kelola pesanan, pantau status, catat pembayaran, dan cetak invoice.</p>
          </div>
        </div>
        <div className="trx-hero-right">
          <div className="trx-stat"><span className="trx-stat-num">{transactions.length}</span><span>Total Transaksi</span></div>
          <div className="trx-stat-div" />
          <div className="trx-stat"><span className="trx-stat-num text-amber">{pendingCount}</span><span>Dalam Proses</span></div>
          <div className="trx-stat-div" />
          <div className="trx-stat"><span className="trx-stat-num text-indigo">{dpCount}</span><span>Belum Lunas</span></div>
          <div className="trx-stat-div" />
          <div className="trx-stat trx-stat-revenue"><span className="trx-stat-num text-emerald">{rp(totalRevenue)}</span><span>Total Lunas</span></div>
          <button className="btn-trx-new" onClick={() => navigate('/transaksi/baru')}>
            <Plus size={16} /> Transaksi Baru
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="trx-filters">
        <div className="trx-search-wrap">
          <Search size={15} className="trx-search-icon" />
          <input
            className="trx-search"
            placeholder="Cari nomor invoice atau nama pasien..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="trx-filter-chips">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'pending', label: 'Pending' },
            { key: 'diproses', label: 'Diproses' },
            { key: 'siap', label: 'Siap' },
            { key: 'selesai', label: 'Selesai' },
            { key: 'dp', label: 'DP' },
            { key: 'lunas', label: 'Lunas' },
          ].map(f => (
            <button
              key={f.key}
              className={`filter-chip ${filterStatus === f.key ? 'active' : ''}`}
              onClick={() => setFilterStatus(f.key)}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="trx-loading"><Loader2 size={36} className="animate-spin" /><p>Memuat riwayat transaksi...</p></div>
      ) : errTrx ? (
        <div className="trx-error">Gagal memuat transaksi dari server.</div>
      ) : (
        <div className="trx-main-layout-full">
          <div className="trx-table-card">
            <div className="trx-table-header">
              <span>Menampilkan {filtered.length} Transaksi</span>
            </div>
            <div className="trx-table-responsive">
              <table className="trx-table">
                <thead>
                  <tr>
                    <th style={{ width: '32px' }}></th>
                    <th>No. Invoice</th>
                    <th>Nama Pasien</th>
                    <th>Tanggal</th>
                    <th>Status Pembayaran</th>
                    <th>Status Pengerjaan</th>
                    <th>Total Belanja</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="trx-table-empty">
                          <ShoppingCart size={44} strokeWidth={1} style={{ marginBottom: '8px', color: '#94a3b8' }} />
                          <p>Tidak ada transaksi ditemukan</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map(trx => {
                      const patient = patients.find(p => p.id === trx.patient_id);
                      const os = orderStatusConfig[trx.order_status as OrderStatus] || orderStatusConfig.pending;
                      const ps = paymentStatusConfig[trx.payment_status as PaymentStatus] || paymentStatusConfig.belum_bayar;
                      const isOpen = selectedTrxId === trx.id;

                      return (
                        <React.Fragment key={trx.id}>
                          {/* ── Main Row ── */}
                          <tr
                            className={`trx-row-clickable ${isOpen ? 'trx-row-active' : ''}`}
                            onClick={() => setSelectedTrxId(isOpen ? null : trx.id)}
                          >
                            <td style={{ textAlign: 'center', paddingRight: 0 }}>
                              <span className={`trx-expand-icon ${isOpen ? 'trx-expand-icon-open' : ''}`}>
                                <ChevronDown size={16} />
                              </span>
                            </td>
                            <td>
                              <span className="trx-inv-field">
                                <span className="trx-field-label">INV</span>
                                <span className="trx-field-val">{trx.invoice_number}</span>
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem' }}>
                                {patient?.name ?? 'Umum'}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#64748b' }}>
                                <Calendar size={13} />
                                {new Date(trx.created_at).toLocaleDateString('id-ID')}
                              </div>
                            </td>
                            <td>
                              <span className="trx-pay-badge" style={{ color: ps.color, background: ps.bg }}>{ps.label}</span>
                            </td>
                            <td>
                              <span className="trx-ord-badge" style={{ color: os.color, background: os.bg }}>
                                {os.icon} <span style={{ marginLeft: '4px' }}>{os.label}</span>
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9375rem' }}>
                                {rp(trx.total_amount)}
                              </div>
                            </td>
                          </tr>

                          {/* ── Expandable Detail Row ── */}
                          {isOpen && (
                            <tr className="trx-expand-row">
                              <td colSpan={7} className="trx-expand-cell">
                                <div className="trx-expand-body">
                                  <TrxDetailPanel
                                    trx={trx}
                                    patients={patients}
                                    onAdvanceStatus={() => advanceStatus(trx)}
                                    onRecordPayment={(amt, method) => recordPayment(trx, amt, method)}
                                    onOpenInvoice={() => setInvoiceTrx(trx)}
                                  />
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {invoiceTrx && <InvoiceModal trx={invoiceTrx} onClose={() => setInvoiceTrx(null)} />}
    </div>
  );
};

// ─── Detail Panel Component ───────────────────────────────────────
interface PanelProps {
  trx: Transaction;
  patients: Patient[];
  onAdvanceStatus: () => void;
  onRecordPayment: (amount: number, method: string) => void;
  onOpenInvoice: () => void;
}

const TrxDetailPanel: React.FC<PanelProps> = ({ trx, patients, onAdvanceStatus, onRecordPayment, onOpenInvoice }) => {
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('tunai');
  const patient = patients.find(p => p.id === trx.patient_id);
  const ps = paymentStatusConfig[trx.payment_status as PaymentStatus] || paymentStatusConfig.belum_bayar;
  const canAdvance = trx.order_status !== 'selesai' && trx.order_status !== 'dibatalkan';

  const products = (trx.items || []).filter((i: TrxItem) => i.product_type !== 'service');
  const services = (trx.items || []).filter((i: TrxItem) => i.product_type === 'service');

  const handleWANotify = () => {
    if (!patient?.phone) {
      alert('No HP Pasien tidak tersedia.');
      return;
    }
    let cleaned = patient.phone.replace(/\\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
    
    const waMsg = encodeURIComponent(`Halo Kak *${patient.name || 'Pelanggan'}*, kacamata pesanan Anda (Invoice: ${trx.invoice_number}) di *Optik 88* sudah selesai dikerjakan dan siap untuk diambil! 😊

Terima kasih atas kepercayaannya.`);
    window.open(`https://wa.me/${cleaned}?text=${waMsg}`, '_blank');
  };

  return (
    <div className="detail-panel-inline animate-fade-in">
      <div className="dpi-cols">

        {/* ── Left col: Info + Items ── */}
        <div className="dpi-left">

          {/* Header strip */}
          <div className="dpi-header">
            <div>
              <div className="dpi-inv">{trx.invoice_number}</div>
              <div className="dpi-meta">
                <span><User size={11} />{patient?.name ?? '—'}</span>
                <span><Calendar size={11} />{new Date(trx.created_at).toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="dpi-header-right">
              {trx.order_status === 'selesai' && (
                <button className="btn-wa-notify" onClick={handleWANotify}>
                  <MessageCircle size={14} /> Kabari Selesai
                </button>
              )}
              <span className="detail-pay-badge" style={{ color: ps.color, background: ps.bg }}>{ps.label}</span>
              <button className="btn-invoice" onClick={onOpenInvoice}>
                <Printer size={14} /> Invoice
              </button>
            </div>
          </div>

          {/* Stepper */}
          <div className="detail-stepper" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
            {ORDER_FLOW.map((s, i) => {
              const currentIdx = ORDER_FLOW.indexOf(trx.order_status as OrderStatus);
              const isDone = i < currentIdx;
              const isStepActive = i === currentIdx;
              return (
                <React.Fragment key={s}>
                  <div className={`step-item ${isDone ? 'step-done' : ''} ${isStepActive ? 'step-active' : ''}`}>
                    <div className="step-circle">
                      {isDone ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
                    </div>
                    <span className="step-label">{ORDER_FLOW_LABELS[s]}</span>
                  </div>
                  {i < ORDER_FLOW.length - 1 && (
                    <div className={`step-connector ${isDone ? 'connector-done' : ''}`}>
                      <ArrowRight size={12} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Advance btn */}
          {canAdvance && (
            <div className="detail-advance-wrap">
              <button className="btn-advance" onClick={onAdvanceStatus}>
                <ChevronRight size={16} />
                Lanjut ke: <strong>{ORDER_FLOW_LABELS[ORDER_FLOW[ORDER_FLOW.indexOf(trx.order_status as OrderStatus) + 1]]}</strong>
              </button>
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-header">
                <div className="detail-section-icon product-icon"><Package size={14} /></div>
                <span>Produk ({products.length} item)</span>
              </div>
              <div className="item-group">
                {products.map((item: TrxItem) => {
                  const ptc = productTypeConfig[item.product_type as keyof typeof productTypeConfig] || productTypeConfig.frame;
                  return (
                    <div key={item.id} className="item-card">
                      <div className="item-card-left">
                        <div className="item-type-badge" style={{ color: ptc.color, background: ptc.bg }}>{ptc.icon} {ptc.label}</div>
                        <div className="item-card-name">{item.name}</div>
                        <div className="item-card-meta">
                          {item.qty}x × <span className="item-price">{rp(item.sell_price)}</span>
                          {item.sell_price !== item.original_price && <span className="item-orig"> ({rp(item.original_price)})</span>}
                        </div>
                      </div>
                      <div className="item-card-sub">{rp(item.subtotal)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Services */}
          {services.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-header">
                <div className="detail-section-icon service-icon"><Wrench size={14} /></div>
                <span>Jasa ({services.length} item)</span>
              </div>
              <div className="item-group item-group-service">
                {services.map((item: TrxItem) => (
                  <div key={item.id} className="item-card">
                    <div className="item-card-left">
                      <div className="item-type-badge" style={{ color: '#d97706', background: '#fef3c7' }}><Wrench size={11} /> Jasa</div>
                      <div className="item-card-name">{item.name}</div>
                      <div className="item-card-meta">{item.qty}x × <span className="item-price">{rp(item.sell_price)}</span></div>
                    </div>
                    <div className="item-card-sub">{rp(item.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right col: Finance ── */}
        <div className="dpi-right">
          <div className="bill-card">
            <div className="bill-card-header">Rincian Tagihan</div>
            <div className="bill-rows">
              <div className="bill-row"><span>Subtotal</span><span>{rp(trx.subtotal)}</span></div>
              {trx.discount > 0 && (
                <div className="bill-row bill-discount"><span>Diskon</span><span>− {rp(trx.discount)}</span></div>
              )}
              <div className="bill-row bill-total"><span>Total Tagihan</span><span>{rp(trx.total_amount)}</span></div>
            </div>
            <div className="bill-payment-rows">
              <div className="bill-row bill-paid">
                <span className="bill-label-icon"><CheckCircle size={13} /> Sudah Dibayar</span>
                <span>{rp(trx.paid_amount)}</span>
              </div>
              {trx.remaining_amount > 0 ? (
                <div className="bill-row bill-remaining">
                  <span className="bill-label-icon"><CreditCard size={13} /> Sisa Tagihan</span>
                  <span>{rp(trx.remaining_amount)}</span>
                </div>
              ) : (
                <div className="bill-settled"><CheckCircle size={14} /> Tagihan Lunas</div>
              )}
            </div>
            <div className="bill-method-tag">
              <CreditCard size={12} />
              <span>Metode:</span>
              <strong>{trx.payment_method?.toUpperCase() || '—'}</strong>
            </div>
          </div>

          {trx.remaining_amount > 0 && (
            <div className="pay-action-card">
              <div className="pay-action-header">
                <div className="detail-section-icon pay-icon"><Banknote size={14} /></div>
                <span>Catat Pembayaran</span>
              </div>
              <div className="pay-remaining-chip">
                Sisa: <strong>{rp(trx.remaining_amount)}</strong>
              </div>
              <div className="pay-method-select">
                <label>Metode Bayar</label>
                <div className="pay-method-pills">
                  {[{v:'tunai',l:'Tunai'},{v:'transfer',l:'Transfer'},{v:'debit',l:'Debit'},{v:'kredit',l:'Kredit'}].map(m => (
                    <button key={m.v} className={`pay-pill ${payMethod === m.v ? 'active' : ''}`} onClick={() => setPayMethod(m.v)}>{m.l}</button>
                  ))}
                </div>
              </div>
              <div className="pay-amount-row">
                <div className="pay-input-wrap">
                  <span className="pay-prefix">Rp</span>
                  <input type="number" className="pay-input" placeholder="Nominal bayar..." value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                </div>
                <button className="btn-pay-partial" onClick={() => { const amt = parseInt(payAmount); if (amt > 0) { onRecordPayment(amt, payMethod); setPayAmount(''); } }} disabled={!payAmount || parseInt(payAmount) <= 0}>
                  Bayar
                </button>
              </div>
              <button className="btn-pay-full" onClick={() => { onRecordPayment(trx.remaining_amount, payMethod); setPayAmount(''); }}>
                <CheckCircle size={15} /> Lunasi Semua — {rp(trx.remaining_amount)}
              </button>
            </div>
          )}

          {trx.notes && <div className="detail-notes">📝 {trx.notes}</div>}
        </div>
      </div>
    </div>
  );
};

export default TransactionPage;
