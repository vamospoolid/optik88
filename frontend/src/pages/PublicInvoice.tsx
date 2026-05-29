import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { transactionsService, patientsService, examinationsService } from '../services/api';

const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const formatValue = (val?: number) => {
  if (val === undefined || val === null || val === 0) return '—';
  return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
};

const formatAxis = (val?: number) => {
  if (val === undefined || val === null || val === 0) return '—';
  return `${val}°`;
};

export default function PublicInvoice() {
  const { id } = useParams<{ id: string }>();

  const { data: trx, isLoading: isLoadingTrx } = useQuery<any>({
    queryKey: ['public_transaction', id],
    queryFn: () => transactionsService.getById(id!),
    enabled: !!id,
  });

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ['public_patients'],
    queryFn: patientsService.getAll,
  });

  const patient = patients.find(p => p.id === trx?.patient_id);

  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ['public_examinations', trx?.patient_id],
    queryFn: () => examinationsService.getAll(trx!.patient_id),
    enabled: !!trx?.patient_id,
  });

  const linkedExam = exams.find(e => e.prescription?.id === trx?.prescription_id);
  const rx = linkedExam?.prescription;
  const od = rx?.details?.find((d: any) => d.eye === 'R' || d.eye === 'OD');
  const os = rx?.details?.find((d: any) => d.eye === 'L' || d.eye === 'OS');

  if (isLoadingTrx) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8FAFC' }}>
        <Loader2 size={32} className="animate-spin text-primary" style={{ marginBottom: '16px' }} />
        <span>Memuat Invoice...</span>
      </div>
    );
  }

  if (!trx) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', background: '#F8FAFC', height: '100vh' }}>
        <h2>Invoice Tidak Ditemukan</h2>
        <p>Silakan periksa kembali link Anda.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', minHeight: '100vh' }}>
      <div style={{ padding: '24px', fontFamily: '"Inter", sans-serif', color: '#0f172a', fontSize: '14px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #4F46E5', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '28px', fontWeight: 700, color: '#4F46E5' }}>Optik88</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Jl. Contoh No. 1, Jakarta</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Telp: 021-123456</div>
          <div style={{ fontSize: '14px', fontWeight: 700, background: '#EEF2FF', padding: '6px 16px', borderRadius: '20px', display: 'inline-block', marginTop: '12px', color: '#4F46E5' }}>
            {trx.invoice_number}
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '20px 0', padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pasien</div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>{patient?.name ?? '—'}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{patient?.phone ?? ''}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tanggal</div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{new Date(trx.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</div>
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status Pengerjaan</span><br/>
              <span style={{ display: 'inline-block', marginTop: '4px', padding: '4px 8px', background: trx.order_status === 'selesai' ? '#D1FAE5' : '#DBEAFE', color: trx.order_status === 'selesai' ? '#059669' : '#1D4ED8', borderRadius: '4px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                {trx.order_status}
              </span>
            </div>
          </div>
        </div>

        {/* Resep Kacamata */}
        {rx && (
          <div style={{ margin: '20px 0', padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px' }}>
            <div style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
              🔬 Resep Kacamata (Refraksi)
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(4, 1fr)', textAlign: 'center', padding: '8px 0', fontWeight: 700, color: '#64748b', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9' }}>
              <span>Mata</span>
              <span>SPH</span>
              <span>CYL</span>
              <span>AXIS</span>
              <span>ADD</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(4, 1fr)', alignItems: 'center', textAlign: 'center', padding: '8px 0', borderBottom: '1px dashed #F1F5F9', color: '#334155' }}>
              <strong style={{ textAlign: 'left', color: '#0F172A' }}>OD (Kanan)</strong>
              <span>{formatValue(od?.sph)}</span>
              <span>{formatValue(od?.cyl)}</span>
              <span>{formatAxis(od?.axis)}</span>
              <span>{formatValue(od?.add_power)}</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(4, 1fr)', alignItems: 'center', textAlign: 'center', padding: '8px 0', borderBottom: '1px dashed #F1F5F9', color: '#334155' }}>
              <strong style={{ textAlign: 'left', color: '#0F172A' }}>OS (Kiri)</strong>
              <span>{formatValue(os?.sph)}</span>
              <span>{formatValue(os?.cyl)}</span>
              <span>{formatAxis(os?.axis)}</span>
              <span>{formatValue(os?.add_power)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #E2E8F0', fontSize: '11px', color: '#475569' }}>
              <div><strong>Tipe Lensa:</strong> <span style={{ textTransform: 'capitalize' }}>{rx.type}</span></div>
              {rx.pd && <div><strong>Pupil Distance (PD):</strong> <span>{rx.pd} mm</span></div>}
            </div>
          </div>
        )}

        {/* Items */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #E2E8F0' }}>
            Rincian Belanja
          </div>
          {trx.items.map((item: any) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px dashed #E2E8F0' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {item.qty}x @ {rp(item.sell_price)}
                </div>
              </div>
              <div style={{ fontWeight: 600, fontSize: '14px', textAlign: 'right' }}>
                {rp(item.subtotal)}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Subtotal</span>
            <span>{rp(trx.subtotal)}</span>
          </div>
          {trx.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: '#ef4444' }}>
              <span>Diskon</span>
              <span>- {rp(trx.discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', margin: '8px 0', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', fontSize: '16px', fontWeight: 800, color: '#4F46E5' }}>
            <span>TOTAL TAGIHAN</span>
            <span>{rp(trx.total_amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Dibayar ({trx.payment_method?.toUpperCase()})</span>
            <span style={{ fontWeight: 600 }}>{rp(trx.paid_amount)}</span>
          </div>
          {trx.remaining_amount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: '#B45309', fontWeight: 800, background: '#FEF3C7', borderRadius: '6px', paddingInline: '8px', marginTop: '8px' }}>
              <span>SISA PIUTANG (DP)</span>
              <span>{rp(trx.remaining_amount)}</span>
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{ 
          textAlign: 'center', margin: '24px 0', padding: '12px', borderRadius: '8px', fontWeight: 700, fontSize: '16px',
          background: trx.payment_status === 'lunas' ? '#D1FAE5' : '#FEF3C7',
          color: trx.payment_status === 'lunas' ? '#059669' : '#B45309'
        }}>
          {trx.payment_status === 'lunas' ? '✅ TRANSAKSI LUNAS' : `⏳ BELUM LUNAS — Sisa ${rp(trx.remaining_amount)}`}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#94A3B8', marginTop: '32px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
          <p>Terima kasih atas kepercayaan Anda</p>
          <p style={{ marginTop: '4px' }}>Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</p>
        </div>

      </div>
    </div>
  );
}
