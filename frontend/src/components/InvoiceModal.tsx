import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { patientsService, examinationsService } from '../services/api';
import type { Transaction, Patient } from 'optik88-shared';
import { useVenueStore } from '../store/useVenueStore';
import './InvoiceModal.css';

const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const formatValue = (val?: number) => {
  if (val === undefined || val === null || val === 0) return '—';
  return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
};

const formatAxis = (val?: number) => {
  if (val === undefined || val === null || val === 0) return '—';
  return `${val}°`;
};

interface Props { trx: Transaction; onClose: () => void; }

const InvoiceModal: React.FC<Props> = ({ trx, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { venue } = useVenueStore();

  // Fetch patients via React Query
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: patientsService.getAll,
  });

  const patient = patients.find(p => p.id === trx.patient_id);

  // Fetch clinical exams for this patient to find the linked prescription
  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ['examinations', trx.patient_id],
    queryFn: () => examinationsService.getAll(trx.patient_id),
    enabled: !!trx.patient_id,
  });

  const linkedExam = exams.find(e => e.prescription?.id === trx.prescription_id);
  const rx = linkedExam?.prescription;
  const od = rx?.details?.find((d: any) => d.eye === 'R' || d.eye === 'OD');
  const os = rx?.details?.find((d: any) => d.eye === 'L' || d.eye === 'OS');

  const handlePrintA4 = () => {
    const content = printRef.current?.innerHTML ?? '';
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>${trx.invoice_number} - A4</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; padding: 24px; color: #0f172a; font-size: 13px; }
            .inv-header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 16px; margin-bottom: 16px; }
            .inv-logo { font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 700; color: #4F46E5; }
            .inv-subtitle { font-size: 11px; color: #64748b; }
            .inv-number { font-size: 12px; font-weight: 700; background: #EEF2FF; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-top: 8px; }
            .inv-instagram { font-size: 10px; color: #94a3b8; margin-top: 2px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 16px 0; padding: 12px; background: #F8FAFC; border-radius: 8px; }
            .info-label { font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-value { font-weight: 600; }
            
            /* Prescription Card styles for printing */
            .invoice-prescription-card { margin: 16px 0; padding: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 11px; }
            .rx-card-title { font-weight: 800; font-size: 10px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; }
            .rx-grid-header, .rx-grid-row { display: grid; grid-template-columns: 1.2fr repeat(4, 1fr); align-items: center; text-align: center; padding: 4px 0; }
            .rx-grid-header { font-weight: 700; color: #64748b; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #F1F5F9; }
            .rx-grid-row { border-bottom: 1px dashed #F1F5F9; color: #334155; }
            .rx-grid-row .eye-lbl { text-align: left; font-weight: 700; color: #0F172A; }
            .rx-card-footer { display: flex; justify-content: space-between; margin-top: 8px; padding-top: 6px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #475569; }

            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th { background: #4F46E5; color: white; padding: 8px; font-size: 11px; text-align: left; }
            td { padding: 8px; border-bottom: 1px dashed #E2E8F0; }
            .subtotal-col { text-align: right; }
            .totals { border-top: 2px solid #E2E8F0; margin-top: 8px; }
            .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
            .total-grand { font-size: 16px; font-weight: 700; color: #4F46E5; padding: 8px 0; border-top: 1px solid #E2E8F0; }
            .status-box { text-align: center; margin: 12px 0; padding: 8px; border-radius: 8px; font-weight: 700; }
            .status-lunas { background: #D1FAE5; color: #059669; }
            .status-dp { background: #FEF3C7; color: #B45309; }
            .footer { text-align: center; font-size: 11px; color: #94A3B8; margin-top: 20px; border-top: 1px solid #E2E8F0; padding-top: 12px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  // Helper untuk build header HTML invoice dari venue
  const venueHeaderHtml = `
    <div class="inv-header">
      <div class="inv-logo">${venue.name}</div>
      ${venue.tagline ? `<div class="inv-subtitle">${venue.tagline}</div>` : ''}
      <div class="inv-subtitle">${venue.address}${venue.city ? ', ' + venue.city : ''}</div>
      <div class="inv-subtitle">Telp: ${venue.phone}${venue.email ? ' · ' + venue.email : ''}</div>
      ${venue.instagram ? `<div class="inv-instagram">${venue.instagram}</div>` : ''}
    </div>
  `;

  const handlePrintThermal = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    
    // Format tanggal
    const dateStr = new Date(trx.created_at).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const itemsHtml = trx.items.map(item => `
      <div class="item-row">
        <div class="item-name">${item.name}</div>
        <div class="item-details">
          <span>${item.qty}x ${rp(item.sell_price)}</span>
          <span>${rp(item.subtotal)}</span>
        </div>
      </div>
    `).join('');

    w.document.write(`
      <html>
        <head>
          <title>Thermal - ${trx.invoice_number}</title>
          <style>
            /* Reset & Base Thermal Styles */
            @page { margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: monospace; 
              color: #000; 
              font-size: 12px; 
              width: 58mm; /* Thermal 58mm standard width */
              margin: 0 auto;
              padding: 4mm;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-3 { margin-bottom: 12px; }
            
            /* Typography */
            h1 { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
            p { font-size: 12px; line-height: 1.2; }
            
            /* Dividers */
            .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
            .divider-double { border-bottom: 2px dashed #000; margin: 8px 0; }
            
            /* Items */
            .item-row { margin-bottom: 6px; }
            .item-name { word-break: break-all; margin-bottom: 2px; }
            .item-details { display: flex; justify-content: space-between; }
            
            /* Totals */
            .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .grand-total { font-size: 14px; font-weight: bold; }
            
            /* Status Box for thermal (no backgrounds, just borders) */
            .status-box { 
              text-align: center; 
              padding: 4px; 
              border: 1px solid #000; 
              font-weight: bold;
              margin: 8px 0;
            }
          </style>
        </head>
        <body>
          <div class="text-center mb-2">
            <h1>${venue.name}</h1>
            ${venue.tagline ? `<p style="font-size:10px;">${venue.tagline}</p>` : ''}
            <p>${venue.address}${venue.city ? ', ' + venue.city : ''}</p>
            <p>${venue.phone}${venue.email ? ' | ' + venue.email : ''}</p>
            ${venue.instagram ? `<p style="font-size:10px;">${venue.instagram}</p>` : ''}
          </div>
          
          <div class="divider"></div>
          
          <p class="mb-1">INV : ${trx.invoice_number}</p>
          <p class="mb-1">TGL : ${dateStr}</p>
          <p class="mb-1">KSR : ${trx.created_by || 'Admin'}</p>
          <p class="mb-1">PLG : ${patient?.name || 'Umum'}</p>
          
          ${rx ? `
            <div class="divider"></div>
            <div class="text-center bold mb-1">RESEP KACAMATA</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 6px; font-family: monospace;">
              <thead>
                <tr style="border-bottom: 1px solid #000;">
                  <th style="background: none; color: #000; padding: 2px 0; text-align: left; font-size: 10px;">MATA</th>
                  <th style="background: none; color: #000; padding: 2px 0; text-align: center; font-size: 10px;">SPH</th>
                  <th style="background: none; color: #000; padding: 2px 0; text-align: center; font-size: 10px;">CYL</th>
                  <th style="background: none; color: #000; padding: 2px 0; text-align: center; font-size: 10px;">AXS</th>
                  <th style="background: none; color: #000; padding: 2px 0; text-align: center; font-size: 10px;">ADD</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px dashed #000;">
                  <td style="padding: 2px 0; text-align: left; font-weight: bold;">OD (R)</td>
                  <td style="padding: 2px 0; text-align: center;">${formatValue(od?.sph)}</td>
                  <td style="padding: 2px 0; text-align: center;">${formatValue(od?.cyl)}</td>
                  <td style="padding: 2px 0; text-align: center;">${formatAxis(od?.axis)}</td>
                  <td style="padding: 2px 0; text-align: center;">${formatValue(od?.add_power)}</td>
                </tr>
                <tr style="border-bottom: 1px dashed #000;">
                  <td style="padding: 2px 0; text-align: left; font-weight: bold;">OS (L)</td>
                  <td style="padding: 2px 0; text-align: center;">${formatValue(os?.sph)}</td>
                  <td style="padding: 2px 0; text-align: center;">${formatValue(os?.cyl)}</td>
                  <td style="padding: 2px 0; text-align: center;">${formatAxis(os?.axis)}</td>
                  <td style="padding: 2px 0; text-align: center;">${formatValue(os?.add_power)}</td>
                </tr>
              </tbody>
            </table>
            <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 4px;">
              <span>TIPE: ${rx.type.toUpperCase()}</span>
              ${rx.pd ? `<span>PD: ${rx.pd} mm</span>` : ''}
            </div>
          ` : ''}

          <div class="divider"></div>
          
          <!-- Items List -->
          ${itemsHtml}
          
          <div class="divider"></div>
          
          <!-- Totals -->
          <div class="total-row"><span>Subtotal</span><span>${rp(trx.subtotal)}</span></div>
          ${trx.discount > 0 ? `<div class="total-row"><span>Diskon</span><span>-${rp(trx.discount)}</span></div>` : ''}
          <div class="total-row grand-total mb-2"><span>TOTAL</span><span>${rp(trx.total_amount)}</span></div>
          
          <div class="total-row"><span>BAYAR (${trx.payment_method.toUpperCase()})</span><span>${rp(trx.paid_amount)}</span></div>
          ${trx.remaining_amount > 0 ? `<div class="total-row bold"><span>SISA (DP)</span><span>${rp(trx.remaining_amount)}</span></div>` : ''}
          
          <div class="status-box">
            ${trx.payment_status === 'lunas' ? 'LUNAS' : 'DOWN PAYMENT'}
          </div>
          
          <div class="text-center mb-3">
            <p>Terima Kasih</p>
            <p style="font-size: 10px; margin-top: 4px;">${venue.notes}</p>
            ${venue.website ? `<p style="font-size: 9px; margin-top: 2px;">${venue.website}</p>` : ''}
          </div>
        </body>
      </html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  return (
    <div className="modal-overlay animate-fade-in invoice-modal-overlay">
      <div className="modal-content invoice-modal">
        <div className="modal-header">
          <h2>Preview Invoice</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn" 
              style={{ background: '#25D366', color: 'white', border: 'none' }}
              onClick={() => {
                const phone = patient?.phone;
                if (!phone) { alert('No HP Pasien tidak tersedia.'); return; }
                let cleaned = phone.replace(/\D/g, '');
                if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
                
                const sisa = Math.max(0, trx.total_amount - trx.paid_amount);
                const sisaText = sisa > 0 ? `Sisa Piutang (DP): *${rp(sisa)}*` : `Status Pembayaran: *LUNAS*`;
                
                const waMsg = encodeURIComponent(`Halo Kak *${patient?.name || 'Pelanggan'}*, terima kasih telah berbelanja di *Optik 88*.

Berikut adalah *Invoice Digital* pesanan Anda:
👉 https://optik.codenusa.id/invoice/${trx.id}

${sisaText}
Status Pengerjaan: *${trx.order_status?.toUpperCase()}*

Anda bisa mengklik link di atas kapan saja untuk melihat detail pesanan, rincian pembayaran, dan resep kacamata Anda.
Semoga sehat selalu! 😊`);
                window.open(`https://wa.me/${cleaned}?text=${waMsg}`, '_blank');
              }}
            >
              Kirim ke WA
            </button>
            <button className="btn btn-secondary" onClick={handlePrintThermal}><Printer size={16} /> Struk</button>
            <button className="btn btn-primary" onClick={handlePrintA4}><Printer size={16} /> A4</button>
            <button className="btn-icon" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="invoice-scroll">
          <div ref={printRef} className="invoice-paper">
            {/* Header */}
            <div className="inv-header">
              <div className="inv-logo">{venue.name}</div>
              {venue.tagline && <div className="inv-subtitle">{venue.tagline}</div>}
              <div className="inv-subtitle">{venue.address}{venue.city ? `, ${venue.city}` : ''}</div>
              <div className="inv-subtitle">Telp: {venue.phone}{venue.email ? ` · ${venue.email}` : ''}</div>
              {venue.instagram && <div className="inv-subtitle" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{venue.instagram}</div>}
              <div className="inv-number">{trx.invoice_number}</div>
            </div>

            {/* Info Grid */}
            <div className="info-grid">
              <div>
                <div className="info-label">Pasien</div>
                <div className="info-value">{patient?.name ?? '—'}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{patient?.phone ?? ''}</div>
              </div>
              <div>
                <div className="info-label">Tanggal</div>
                <div className="info-value">{new Date(trx.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</div>
              </div>
              <div>
                <div className="info-label">Kasir</div>
                <div className="info-value">{trx.created_by}</div>
              </div>
              <div>
                <div className="info-label">Metode</div>
                <div className="info-value">{trx.payment_method.toUpperCase()}</div>
              </div>
            </div>

            {/* Refraction Details Section */}
            {rx && (
              <div className="invoice-prescription-card">
                <div className="rx-card-title">🔬 Resep Kacamata / Hasil Refraksi</div>
                <div className="rx-grid-header">
                  <span>Mata</span>
                  <span>SPH</span>
                  <span>CYL</span>
                  <span>AXIS</span>
                  <span>ADD</span>
                </div>
                <div className="rx-grid-row">
                  <strong className="eye-lbl">OD (Kanan)</strong>
                  <span>{formatValue(od?.sph)}</span>
                  <span>{formatValue(od?.cyl)}</span>
                  <span>{formatAxis(od?.axis)}</span>
                  <span>{formatValue(od?.add_power)}</span>
                </div>
                <div className="rx-grid-row">
                  <strong className="eye-lbl">OS (Kiri)</strong>
                  <span>{formatValue(os?.sph)}</span>
                  <span>{formatValue(os?.cyl)}</span>
                  <span>{formatAxis(os?.axis)}</span>
                  <span>{formatValue(os?.add_power)}</span>
                </div>
                <div className="rx-card-footer">
                  <div><strong>Tipe Lensa:</strong> <span style={{ textTransform: 'capitalize' }}>{rx.type}</span></div>
                  {rx.pd && <div><strong>Pupil Distance (PD):</strong> <span>{rx.pd} mm</span></div>}
                </div>
              </div>
            )}

            {/* Items Table */}
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Item</th>
                  <th>Tipe</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Harga</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {trx.items.map(item => (
                  <tr key={item.id}>
                    <td>
                      {item.name}
                      {item.sell_price !== item.original_price && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textDecoration: 'line-through' }}>{rp(item.original_price)}</div>
                      )}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{item.product_type}</td>
                    <td style={{ textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right' }}>{rp(item.sell_price)}</td>
                    <td className="subtotal-col">{rp(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="totals">
              <div className="total-row"><span>Subtotal</span><span>{rp(trx.subtotal)}</span></div>
              {trx.discount > 0 && <div className="total-row" style={{ color: '#ef4444' }}><span>Diskon</span><span>- {rp(trx.discount)}</span></div>}
              <div className="total-row total-grand"><span>TOTAL</span><span>{rp(trx.total_amount)}</span></div>
              <div className="total-row"><span>Dibayar</span><span>{rp(trx.paid_amount)}</span></div>
              {trx.remaining_amount > 0 && (
                <div className="total-row" style={{ color: '#ef4444', fontWeight: 700 }}><span>Sisa (DP)</span><span>{rp(trx.remaining_amount)}</span></div>
              )}
            </div>

            {/* Status badge */}
            <div className={`status-box ${trx.payment_status === 'lunas' ? 'status-lunas' : 'status-dp'}`}>
              {trx.payment_status === 'lunas' ? '✅ LUNAS' : `⏳ DOWN PAYMENT — Sisa ${rp(trx.remaining_amount)}`}
            </div>

            {trx.notes && <p style={{ fontSize: '0.8125rem', color: '#64748b', fontStyle: 'italic', marginTop: '8px' }}>📝 {trx.notes}</p>}

            <div className="footer">
              <p>{venue.notes}</p>
              {venue.website && <p style={{ marginTop: '2px' }}>🌐 {venue.website}</p>}
              <p style={{ marginTop: '4px' }}>Status Pesanan: <strong style={{ textTransform: 'capitalize' }}>{trx.order_status}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
