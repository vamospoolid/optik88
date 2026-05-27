import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Phone, FileText, Calendar, Plus, MapPin,
  Activity, ShoppingBag, ChevronDown, ChevronUp, Eye, Shield,
  User, Clock, Stethoscope, Sparkles, MessageSquare, Trash2
} from 'lucide-react';
import { patientsService, examinationsService, transactionsService } from '../services/api';

const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

function RxCell({ label, value }: { label: string; value?: number | null }) {
  return (
    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', padding: '6px 4px', backdropFilter: 'blur(4px)' }}>
      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: 'transparent' }}>{label}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e1b4b', marginTop: '2px', fontFamily: 'monospace' }}>
        {value != null && value !== 0 ? (value > 0 ? `+${value}` : value) : '0'}
      </div>
    </div>
  );
}

function ExamCard({ ex, index }: { ex: any; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const isInternal = ex.source === 'internal';
  const rx = ex.prescription;
  const details = rx?.details || [];
  const od = details.find((d: any) => d.eye === 'R') || {};
  const os = details.find((d: any) => d.eye === 'L') || {};

  return (
    <div style={{
      borderRadius: '18px', overflow: 'hidden',
      border: `1.5px solid ${isInternal ? 'rgba(43,53,232,0.2)' : 'rgba(245,158,11,0.3)'}`,
      marginBottom: '0.875rem',
      boxShadow: expanded ? '0 4px 24px rgba(43,53,232,0.10)' : '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s'
    }}>
      {/* Card Header */}
      <div
        style={{
          background: isInternal
            ? 'linear-gradient(135deg, #2b35e8 0%, #4f46e5 100%)'
            : 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
          padding: '12px 14px', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isInternal ? <Stethoscope size={16} color="white" /> : <FileText size={16} color="white" />}
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '0.8125rem' }}>
              {isInternal ? 'Pemeriksaan Internal Optik' : `Resep Rujukan ${ex.external_source_type?.toUpperCase() || 'Luar'}`}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Clock size={11} />
              {fmtDate(ex.exam_date)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: '20px' }}>
            {isInternal ? 'INTERNAL' : 'RUJUKAN'}
          </span>
          {expanded ? <ChevronUp size={16} color="white" /> : <ChevronDown size={16} color="white" />}
        </div>
      </div>

      {/* Quick Rx Preview (always visible) */}
      {!expanded && rx && (
        <div style={{ padding: '8px 14px', background: '#f8f9ff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700 }}>
            OD: S{od.sph ?? 0} C{od.cyl ?? 0} A{od.axis ?? 0}°
          </div>
          <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#7c3aed', fontWeight: 700 }}>
            OS: S{os.sph ?? 0} C{os.cyl ?? 0} A{os.axis ?? 0}°
          </div>
        </div>
      )}

      {/* Expanded Detail */}
      {expanded && (
        <div style={{ padding: '14px', background: 'white' }}>
          {/* Doctor / Facility info (external) */}
          {!isInternal && (ex.doctor_name || ex.facility_name) && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {ex.doctor_name && <div style={{ fontSize: '0.75rem', color: '#92400e' }}><strong>Dokter:</strong> {ex.doctor_name}</div>}
              {ex.facility_name && <div style={{ fontSize: '0.75rem', color: '#92400e' }}><strong>Faskes:</strong> {ex.facility_name}</div>}
              {ex.reference_number && <div style={{ fontSize: '0.75rem', color: '#92400e' }}><strong>No. Rujukan:</strong> {ex.reference_number}</div>}
            </div>
          )}

          {/* Rx Data per Eye */}
          {rx ? (
            <>
              <div style={{ marginBottom: '10px' }}>
                {/* OD Row */}
                <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ background: 'linear-gradient(90deg,#2b35e8,#4f46e5)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={13} color="white" />
                    <span style={{ color: 'white', fontWeight: 800, fontSize: '0.75rem' }}>MATA KANAN (OD)</span>
                    {od.sph != null && <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', fontFamily: 'monospace' }}>S{od.sph > 0 ? '+' : ''}{od.sph}</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '10px', background: 'linear-gradient(135deg,rgba(43,53,232,0.08) 0%, rgba(79,70,229,0.04) 100%)' }}>
                    <RxCell label="SPH" value={od.sph} />
                    <RxCell label="CYL" value={od.cyl} />
                    <RxCell label="AXIS" value={od.axis} />
                    <RxCell label="ADD" value={od.add_power} />
                  </div>
                </div>
                {/* OS Row */}
                <div style={{ borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg,#7c3aed,#8b5cf6)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={13} color="white" />
                    <span style={{ color: 'white', fontWeight: 800, fontSize: '0.75rem' }}>MATA KIRI (OS)</span>
                    {os.sph != null && <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', fontFamily: 'monospace' }}>S{os.sph > 0 ? '+' : ''}{os.sph}</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '10px', background: 'linear-gradient(135deg,rgba(124,58,237,0.08) 0%,rgba(139,92,246,0.04) 100%)' }}>
                    <RxCell label="SPH" value={os.sph} />
                    <RxCell label="CYL" value={os.cyl} />
                    <RxCell label="AXIS" value={os.axis} />
                    <RxCell label="ADD" value={os.add_power} />
                  </div>
                </div>
              </div>

              {/* PD and Type */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {rx.pd != null && (
                  <div style={{ flex: 1, background: '#f0f9ff', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>PD</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0369a1', fontFamily: 'monospace' }}>{rx.pd} mm</div>
                  </div>
                )}
                {rx.type && (
                  <div style={{ flex: 2, background: '#f5f3ff', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>Tipe Lensa</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#6d28d9', textTransform: 'capitalize' }}>{rx.type}</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <Activity size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              Tidak ada data resep pada pemeriksaan ini
            </div>
          )}

          {ex.notes && (
            <div style={{ marginTop: '10px', background: '#f8f9fa', borderRadius: '10px', padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--primary)' }}>
              <strong>Catatan:</strong> {ex.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  const queryClient = useQueryClient();

  const { data: patient, isLoading } = useQuery<any>({
    queryKey: ['patient', id],
    queryFn: () => patientsService.getById(id!),
    enabled: !!id,
  });

  const { data: allExams = [] } = useQuery<any[]>({
    queryKey: ['examinations'],
    queryFn: examinationsService.getAll,
  });

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ['transactions'],
    queryFn: transactionsService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: () => patientsService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      navigate('/pasien');
    },
  });

  const patientExams = allExams.filter(ex => ex.patient_id === id);
  const patientTrx = transactions.filter(t => t.patient_id === id);
  const isBpjs = !!patient?.bpjs_number;

  const handleDelete = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data pasien "${patient?.name}"? Semua data riwayat pemeriksaan dan transaksi pasien ini juga akan ikut terhapus.`)) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="loading-center">
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #E8EAFF', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
        <span>Memuat profil pasien...</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="empty-state card" style={{ margin: '2rem' }}>
        <h3>Pasien Tidak Ditemukan</h3>
        <button className="btn btn-primary" onClick={() => navigate('/pasien')}>Kembali</button>
      </div>
    );
  }

  return (
    <div className="page-scroll animate-fade-in" style={{ paddingBottom: '6rem', background: 'var(--bg)' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <button style={{ border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/pasien')}>
          <ArrowLeft size={20} className="text-primary" />
        </button>
        <span className="top-bar-title">Profil Pasien</span>
        <button
          style={{ border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#dc2626' }}
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? (
            <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid #fee2e2', borderTopColor: '#dc2626', borderRadius: '50%' }} />
          ) : (
            <Trash2 size={20} />
          )}
        </button>
      </div>

      {/* Hero Profile Card */}
      <div style={{
        margin: '0.75rem 1rem 0',
        borderRadius: '22px',
        background: isBpjs
          ? 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #0e7490 100%)'
          : 'linear-gradient(135deg, #2b35e8 0%, #4f46e5 50%, #1e1b4b 100%)',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isBpjs ? '0 8px 32px rgba(6,182,212,0.3)' : '0 8px 32px rgba(43,53,232,0.3)'
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -10, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', position: 'relative' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800, color: 'white', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }}>
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{patient.name}</h2>
            </div>
            <div style={{ marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              {isBpjs
                ? <><Shield size={13} color="rgba(255,255,255,0.9)" /><span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.72rem', fontWeight: 700 }}>BPJS KESEHATAN</span></>
                : <><User size={13} color="rgba(255,255,255,0.9)" /><span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.72rem', fontWeight: 700 }}>PASIEN UMUM</span></>
              }
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', marginTop: '2px' }}>
              ID: {patient.id}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '1rem', position: 'relative' }}>
          {[
            { icon: Activity, label: 'Periksa', value: patientExams.length },
            { icon: ShoppingBag, label: 'Order', value: patientTrx.length },
            { icon: Calendar, label: 'Tahun', value: patient.birth_date ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear() : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Icon size={16} color="rgba(255,255,255,0.8)" style={{ margin: '0 auto 4px' }} />
              <div style={{ color: 'white', fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>{value}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 600, marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient Info Details */}
      <div className="card" style={{ margin: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Informasi Kontak</div>
        {[
          { icon: Phone, label: 'Telepon', value: patient.phone || '—' },
          { icon: FileText, label: 'NIK', value: patient.nik || '—' },
          { icon: Calendar, label: 'Tgl Lahir', value: patient.birth_date ? fmtDate(patient.birth_date) : '—' },
          { icon: MapPin, label: 'Alamat', value: patient.address || '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={15} className="text-primary" />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '1px' }}>{value}</div>
            </div>
          </div>
        ))}
        {isBpjs && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '10px', background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={15} style={{ color: '#0891b2' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#0891b2', fontWeight: 600 }}>No. BPJS</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0891b2', marginTop: '1px', fontFamily: 'monospace' }}>{patient.bpjs_number}</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '0.5rem 1rem' }}>
        <button
          className="btn ripple"
          style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            borderRadius: '16px',
            fontSize: '0.8125rem',
            padding: '10px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={() => navigate(`/periksa?tab=compare&patientId=${patient.id}`)}
        >
          <Sparkles size={16} />
          <span>Bandingkan Resep</span>
        </button>

        <button
          className="btn btn-primary ripple"
          style={{
            borderRadius: '16px',
            fontSize: '0.8125rem',
            padding: '10px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
          onClick={() => navigate(`/order/baru?patientId=${patient.id}`)}
        >
          <Plus size={16} />
          <span>Buat Order</span>
        </button>
      </div>

      {/* Riwayat Pemeriksaan */}
      <div style={{ padding: '0 1rem' }}>
        <div className="section-header" style={{ marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={15} color="white" />
            </div>
            <span className="section-title">Riwayat Pemeriksaan</span>
          </div>
          <span className="badge badge-blue">{patientExams.length} Kali</span>
        </div>

        {patientExams.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '18px', padding: '2rem', textAlign: 'center', border: '2px dashed var(--border)' }}>
            <Activity size={36} style={{ margin: '0 auto 10px', color: 'var(--text-muted)', opacity: 0.4 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Belum ada catatan pemeriksaan klinis.</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: '10px' }}
              onClick={() => navigate(`/order/baru?patientId=${patient.id}`)}>
              + Buat Order & Pemeriksaan
            </button>
          </div>
        ) : (
          patientExams.map((ex: any, i: number) => <ExamCard key={ex.id} ex={ex} index={i} />)
        )}
      </div>

      {/* Riwayat Transaksi */}
      <div style={{ padding: '0 1rem', marginTop: '0.5rem' }}>
        <div className="section-header" style={{ marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={15} color="white" />
            </div>
            <span className="section-title">Riwayat Belanja / Order</span>
          </div>
          <span className="badge badge-green">{patientTrx.length} Order</span>
        </div>

        {patientTrx.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '18px', padding: '1.5rem', textAlign: 'center', border: '2px dashed var(--border)' }}>
            <ShoppingBag size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Belum ada riwayat transaksi.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {patientTrx.map((t: any) => {
              const statusColor = t.payment_status === 'lunas' ? '#059669' : t.payment_status === 'dp' ? '#d97706' : '#dc2626';
              const statusBg = t.payment_status === 'lunas' ? '#d1fae5' : t.payment_status === 'dp' ? '#fef3c7' : '#fee2e2';
              return (
                <div key={t.id} className="ripple"
                  style={{ background: 'white', borderRadius: '16px', padding: '12px 14px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                  onClick={() => navigate(`/transaksi/${t.id}`)}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t.invoice_number}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={11} />
                      {new Date(t.created_at).toLocaleDateString('id-ID')}
                      {t.items?.length > 0 && <span> • {t.items.length} item</span>}
                    </div>
                    {t.order_status && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'capitalize' }}>
                        Status: {t.order_status}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{rp(t.total_amount)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ display: 'inline-block', background: statusBg, color: statusColor, fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: '20px', textTransform: 'uppercase' }}>
                        {t.payment_status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const waPhone = formatPhoneForWa(patient.phone);
                          if (!waPhone) {
                            alert('Nomor HP pasien belum terisi atau tidak valid!');
                            return;
                          }
                          const waMsg = generateWaInvoiceMessage(t, patient.name);
                          window.open(`https://wa.me/${waPhone}?text=${waMsg}`, '_blank');
                        }}
                        style={{
                          background: '#25D366',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(37,211,102,0.25)',
                          transition: 'transform 0.1s',
                          padding: 0
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title="Kirim Invoice via WhatsApp"
                      >
                        <MessageSquare size={11} />
                      </button>
                    </div>
                    {t.remaining_amount > 0 && (
                      <div style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: 700, marginTop: '2px' }}>Sisa: {rp(t.remaining_amount)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        className="fab"
        onClick={() => navigate(`/order/baru?patientId=${patient.id}`)}
        aria-label="Buat Order Baru"
        style={{ width: '150px', borderRadius: 'var(--radius-pill)', gap: '6px' }}
      >
        <Plus size={18} />
        <span>Buat Order</span>
      </button>
    </div>
  );
}
