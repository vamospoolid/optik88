import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Phone, MapPin, CreditCard,
  Activity, FileText, ShoppingBag, Plus, Eye, Loader2,
  Receipt, ChevronDown, ChevronUp, Glasses, Package, Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsService, examinationsService } from '../services/api';
import ClinicalFormModal from '../components/ClinicalFormModal';
import InvoiceModal from '../components/InvoiceModal';
import './PatientDetail.css';

const PatientDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('ringkasan');
  const [expandedTrx, setExpandedTrx] = useState<string | null>(null);
  const [invoiceTrx, setInvoiceTrx] = useState<any | null>(null);

  const [isClinicalModalOpen, setIsClinicalModalOpen] = useState(false);
  const [clinicalModalType, setClinicalModalType] = useState<'internal' | 'external'>('internal');
  
  // React Query query to fetch the patient with exams & transactions preloaded
  const { data: patient, isLoading, isError } = useQuery<any>({
    queryKey: ['patient', id],
    queryFn: () => patientsService.getOne(id),
    enabled: !!id,
  });

  // React Query mutation to save clinical exam
  const saveExamMutation = useMutation({
    mutationFn: examinationsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      setIsClinicalModalOpen(false);
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: () => patientsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      navigate('/pasien');
    },
  });

  const handleDeletePatient = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data pasien "${patient?.name}"? Semua data riwayat pemeriksaan dan transaksi pasien ini juga akan ikut terhapus.`)) {
      deletePatientMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] flex-col gap-2">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-gray-500">Memuat profil lengkap pasien...</p>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="empty-state min-h-[400px]">
        <div className="empty-icon text-danger"><User size={48} /></div>
        <h3>Pasien tidak ditemukan</h3>
        <p>Gagal memuat rekam medis dari database server.</p>
        <button className="btn btn-secondary mt-3" onClick={() => navigate('/pasien')}>
          Kembali ke Daftar Pasien
        </button>
      </div>
    );
  }

  // Pre-sort examinations newest first
  const patientExams = [...(patient.examinations || [])].sort((a: any, b: any) => 
    b.exam_date.localeCompare(a.exam_date)
  );

  // Pre-sort transactions newest first
  const patientTransactions = [...(patient.transactions || [])].sort((a: any, b: any) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );


  const latestExternalExam = patientExams.find((e: any) => e.source === 'external');
  const latestInternalExam = patientExams.find((e: any) => e.source === 'internal');

  const rxExt = latestExternalExam ? latestExternalExam.prescription : null;
  const rxInt = latestInternalExam ? latestInternalExam.prescription : null;

  return (
    <div className="patient-detail-page">
      <div className="detail-header">
        <button className="btn-icon" onClick={() => navigate('/pasien')}>
          <ArrowLeft size={20} />
        </button>
        <h2>Patient 360°</h2>
      </div>

      <div className="patient-profile-card">
        <div className="profile-hero">
          <div className="profile-avatar">
            {patient.name.charAt(0)}
          </div>
          <div className="profile-info">
            <h1>{patient.name}</h1>
            <span className="badge badge-primary">{patient.id}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn btn-secondary edit-btn">Edit Profil</button>
            <button
              className="btn btn-danger"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onClick={handleDeletePatient}
              disabled={deletePatientMutation.isPending}
            >
              <Trash2 size={16} />
              {deletePatientMutation.isPending ? 'Menghapus...' : 'Hapus Pasien'}
            </button>
          </div>
        </div>

        <div className="profile-details">
          {patient.phone && (
            <div className="detail-item">
              <Phone size={16} className="text-secondary" />
              <div>
                <span className="detail-label">No. HP</span>
                <span className="detail-value">{patient.phone}</span>
              </div>
            </div>
          )}
          {patient.nik && (
            <div className="detail-item">
              <User size={16} className="text-secondary" />
              <div>
                <span className="detail-label">NIK</span>
                <span className="detail-value">{patient.nik}</span>
              </div>
            </div>
          )}
          {patient.bpjs_number && (
            <div className="detail-item">
              <CreditCard size={16} className="text-secondary" />
              <div>
                <span className="detail-label">No. BPJS</span>
                <span className="detail-value">{patient.bpjs_number}</span>
              </div>
            </div>
          )}
          {patient.address && (
            <div className="detail-item">
              <MapPin size={16} className="text-secondary" />
              <div>
                <span className="detail-label">Alamat</span>
                <span className="detail-value">{patient.address}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'ringkasan' ? 'active' : ''}`}
            onClick={() => setActiveTab('ringkasan')}
          >
            Ringkasan
          </button>
          <button
            className={`tab-btn ${activeTab === 'komparasi' ? 'active' : ''}`}
            onClick={() => setActiveTab('komparasi')}
          >
            Komparasi Resep
          </button>
          <button
            className={`tab-btn ${activeTab === 'riwayat' ? 'active' : ''}`}
            onClick={() => setActiveTab('riwayat')}
          >
            Riwayat Transaksi
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'ringkasan' && (
            <div className="summary-tab animate-fade-in">
              <div className="action-cards">
                <button className="action-card bg-primary-light" onClick={() => { setClinicalModalType('internal'); setIsClinicalModalOpen(true); }}>
                  <div className="ac-icon text-primary"><Activity size={24} /></div>
                  <div className="ac-text">
                    <h4>Pemeriksaan Baru</h4>
                    <p>Input hasil periksa optik</p>
                  </div>
                  <Plus size={20} className="text-primary" />
                </button>
                <button className="action-card bg-secondary-light" onClick={() => { setClinicalModalType('external'); setIsClinicalModalOpen(true); }}>
                  <div className="ac-icon text-secondary"><FileText size={24} /></div>
                  <div className="ac-text">
                    <h4>Resep Dokter Luar</h4>
                    <p>Input resep dari luar</p>
                  </div>
                  <Plus size={20} className="text-secondary" />
                </button>
                <button className="action-card bg-warning-light" onClick={() => navigate(`/transaksi/baru?patientId=${patient.id}`)}>
                  <div className="ac-icon text-warning"><ShoppingBag size={24} /></div>
                  <div className="ac-text">
                    <h4>Transaksi Baru</h4>
                    <p>Buat pesanan baru</p>
                  </div>
                  <Plus size={20} className="text-warning" />
                </button>
              </div>

              <h3 className="section-title mt-4">Riwayat Klinis Lengkap</h3>
              {patientExams.length > 0 ? (
                <div className="exam-timeline">
                  {patientExams.map((exam: any) => {
                    const rx = exam.prescription;
                    const isExternal = exam.source === 'external';
                    return (
                      <div key={exam.id} className={`timeline-item ${isExternal ? 'tl-external' : 'tl-internal'}`}>
                        <div className={`timeline-dot ${isExternal ? 'dot-warning' : 'dot-success'}`}>
                          {isExternal ? <FileText size={14} /> : <Eye size={14} />}
                        </div>
                        <div className={`exam-card ${isExternal ? 'exam-card-external' : 'exam-card-internal'}`}>
                          <div className="exam-card-header">
                            <div className="exam-type-badge">
                              <span className={`badge ${isExternal ? 'badge-warning' : 'badge-success'}`}>
                                {isExternal
                                  ? `📋 Resep Luar · ${(exam.external_source_type || '').replace('_', ' ').toUpperCase()}`
                                  : `🔬 Periksa Optik Internal`}
                              </span>
                            </div>
                            <span className="tl-date">{exam.exam_date}</span>
                          </div>

                          {(exam.doctor_name || exam.facility_name) && (
                            <div className="exam-meta">
                              {exam.doctor_name && <span>👨‍⚕️ {exam.doctor_name}</span>}
                              {exam.facility_name && <span>🏥 {exam.facility_name}</span>}
                              {exam.reference_number && <span>🔖 No. {exam.reference_number}</span>}
                            </div>
                          )}

                          {rx ? (
                            <div className="rx-inline-table">
                              <table>
                                <thead>
                                  <tr>
                                    <th>Mata</th>
                                    <th>SPH</th>
                                    <th>CYL</th>
                                    <th>AXIS</th>
                                    <th>ADD</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(rx.details || []).map((d: any, i: number) => (
                                    <tr key={i} className={d.eye === 'R' ? 'row-od' : 'row-os'}>
                                      <td className="eye-cell">
                                        <strong>{d.eye === 'R' ? 'OD' : 'OS'}</strong>
                                        <small>{d.eye === 'R' ? 'Kanan' : 'Kiri'}</small>
                                      </td>
                                      <td>{d.sph > 0 ? `+${Number(d.sph).toFixed(2)}` : Number(d.sph).toFixed(2)}</td>
                                      <td>{d.cyl ? (d.cyl > 0 ? `+${Number(d.cyl).toFixed(2)}` : Number(d.cyl).toFixed(2)) : '—'}</td>
                                      <td>{d.axis != null ? `${d.axis}°` : '—'}</td>
                                      <td>{d.add_power ? `+${Number(d.add_power).toFixed(2)}` : '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="rx-inline-footer">
                                <span>📏 PD: <strong>{rx.pd ?? '—'} mm</strong></span>
                                <span>🔭 Tipe: <strong style={{ textTransform: 'capitalize' }}>{rx.type}</strong></span>
                              </div>
                            </div>
                          ) : (
                            <p className="no-rx-text">Data resep belum dicatat</p>
                          )}

                          {exam.notes && (
                            <div className="exam-notes">
                              <span>📝</span>
                              <pre className="notes-text">{exam.notes}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state-sm">Belum ada riwayat pemeriksaan. Klik tombol di atas untuk menambahkan.</div>
              )}
            </div>
          )}

          {activeTab === 'komparasi' && (
            <div className="comparison-tab animate-fade-in">
              <div className="comparison-header">
                <h3>Komparasi Resep</h3>
                <p>Membandingkan data dari resep dokter luar terbaru dan hasil optik terbaru.</p>
              </div>
              
              {(!latestExternalExam && !latestInternalExam) ? (
                <div className="empty-state-sm">Belum ada data resep atau pemeriksaan untuk dikomparasi.</div>
              ) : (
                <div className="comparison-grid">
                  <div className="comp-col card">
                    <div className="comp-col-header bg-warning-light">
                      <h4>Resep Luar {latestExternalExam?.external_source_type ? `(${latestExternalExam.external_source_type.toUpperCase()})` : ''}</h4>
                      <span>{latestExternalExam?.exam_date || '-'}</span>
                    </div>
                    {latestExternalExam && rxExt ? (
                      <div className="comp-body">
                        <div className="rx-row header-row">
                          <span></span><span>SPH</span><span>CYL</span><span>AX</span><span>ADD</span>
                        </div>
                        {(rxExt.details || []).map((detail: any, idx: number) => (
                          <div className="rx-row" key={idx}>
                            <strong>{detail.eye}</strong>
                            <span>{detail.sph > 0 ? `+${detail.sph.toFixed(2)}` : detail.sph.toFixed(2)}</span>
                            <span>{detail.cyl ? (detail.cyl > 0 ? `+${detail.cyl.toFixed(2)}` : detail.cyl.toFixed(2)) : '0.00'}</span>
                            <span>{detail.axis || '0'}</span>
                            <span>{detail.add_power ? `+${detail.add_power.toFixed(2)}` : '0.00'}</span>
                          </div>
                        ))}
                        <div className="rx-footer">
                           PD: {rxExt.pd || '-'} mm | Tipe: <span style={{textTransform:'capitalize'}}>{rxExt.type}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="comp-body text-center text-tertiary">Data tidak tersedia</div>
                    )}
                  </div>
                  
                  <div className="comp-col card">
                    <div className="comp-col-header bg-success-light">
                      <h4>Hasil Optik (Internal)</h4>
                      <span>{latestInternalExam?.exam_date || '-'}</span>
                    </div>
                    {latestInternalExam && rxInt ? (
                      <div className="comp-body">
                        <div className="rx-row header-row">
                          <span></span><span>SPH</span><span>CYL</span><span>AX</span><span>ADD</span>
                        </div>
                        {(rxInt.details || []).map((detail: any, idx: number) => {
                           const extDetail = rxExt?.details?.find((d: any) => d.eye === detail.eye);
                           const diffSph = extDetail && extDetail.sph !== detail.sph;
                           const diffCyl = extDetail && extDetail.cyl !== detail.cyl;
                           const diffAxis = extDetail && extDetail.axis !== detail.axis;
                           const diffAdd = extDetail && extDetail.add_power !== detail.add_power;

                           return (
                             <div className="rx-row" key={idx}>
                               <strong>{detail.eye}</strong>
                               <span className={diffSph ? "text-danger font-bold highlight-diff" : ""}>
                                 {detail.sph > 0 ? `+${detail.sph.toFixed(2)}` : detail.sph.toFixed(2)}
                               </span>
                               <span className={diffCyl ? "text-danger font-bold highlight-diff" : ""}>
                                 {detail.cyl ? (detail.cyl > 0 ? `+${detail.cyl.toFixed(2)}` : detail.cyl.toFixed(2)) : '0.00'}
                               </span>
                               <span className={diffAxis ? "text-danger font-bold highlight-diff" : ""}>
                                 {detail.axis || '0'}
                               </span>
                               <span className={diffAdd ? "text-danger font-bold highlight-diff" : ""}>
                                 {detail.add_power ? `+${detail.add_power.toFixed(2)}` : '0.00'}
                               </span>
                             </div>
                           );
                        })}
                        <div className="rx-footer">
                           PD: {rxInt.pd || '-'} mm | Tipe: <span style={{textTransform:'capitalize'}}>{rxInt.type}</span>
                        </div>
                      </div>
                    ) : (
                       <div className="comp-body text-center text-tertiary">Data tidak tersedia</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'riwayat' && (
            <div className="history-tab animate-fade-in">
              {patientTransactions.length === 0 ? (
                <div className="empty-state-sm">Belum ada riwayat transaksi untuk pasien ini.</div>
              ) : (
                <div className="trx-history-list">
                  {patientTransactions.map((t: any) => {
                    const statusColor: Record<string, string> = {
                      lunas: 'badge-success', dp: 'badge-warning', belum_bayar: 'badge-danger'
                    };
                    const orderColor: Record<string, string> = {
                      selesai: 'badge-success', siap: 'badge-info', diproses: 'badge-primary',
                      pending: 'badge-warning', dibatalkan: 'badge-danger'
                    };
                    const isExpanded = expandedTrx === t.id;
                    const frames = (t.items || []).filter((i: any) => i.product_type === 'frame');
                    const lenses = (t.items || []).filter((i: any) => i.product_type === 'lens');
                    const services = (t.items || []).filter((i: any) => i.product_type === 'service');
                    const lensType = t.prescription?.type;

                    return (
                      <div key={t.id} className={`trx-history-card ${isExpanded ? 'expanded' : ''}`}>
                        {/* Header row — selalu tampil */}
                        <div
                          className="trx-hist-top"
                          role="button"
                          tabIndex={0}
                          onClick={() => setExpandedTrx(isExpanded ? null : t.id)}
                          onKeyDown={(e) => e.key === 'Enter' && setExpandedTrx(isExpanded ? null : t.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div>
                            <span className="trx-hist-invoice">
                              <Receipt size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                              {t.invoice_number}
                            </span>
                            <span className="trx-hist-date">{new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div className="trx-hist-badges">
                              <span className={`badge badge-sm ${orderColor[t.order_status] || 'badge-warning'}`}>{t.order_status}</span>
                              <span className={`badge badge-sm ${statusColor[t.payment_status] || 'badge-warning'}`}>{t.payment_status.replace('_', ' ')}</span>
                            </div>
                            <span className="trx-expand-icon">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </div>
                        </div>

                        {/* Quick summary — selalu tampil */}
                        <div className="trx-hist-quick">
                          {lensType && (
                            <span className="trx-chip chip-lens">
                              <Glasses size={11} /> Lensa {lensType}
                            </span>
                          )}
                          {frames.map((f: any) => (
                            <span key={f.id} className="trx-chip chip-frame">
                              <Package size={11} /> Frame: {f.name}
                            </span>
                          ))}
                          {lenses.map((l: any) => (
                            <span key={l.id} className="trx-chip chip-lensitem">
                              👁 {l.name}
                            </span>
                          ))}
                          {services.map((s: any) => (
                            <span key={s.id} className="trx-chip chip-service">
                              🔧 {s.name}
                            </span>
                          ))}
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="trx-expanded-detail">
                            <div className="trx-items-detail-table">
                              <div className="trx-detail-header">
                                <span>Produk / Layanan</span>
                                <span>Tipe</span>
                                <span style={{ textAlign: 'right' }}>Harga</span>
                                <span style={{ textAlign: 'center' }}>Qty</span>
                                <span style={{ textAlign: 'right' }}>Subtotal</span>
                              </div>
                              {(t.items || []).map((item: any) => (
                                <div key={item.id} className="trx-detail-row">
                                  <span className="trx-item-name">{item.name}</span>
                                  <span>
                                    <span className={`dot dot-${item.product_type}`} style={{ marginRight: 4 }} />
                                    <span className="trx-type-label">{item.product_type}</span>
                                  </span>
                                  <span style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.sell_price)}
                                  </span>
                                  <span style={{ textAlign: 'center' }}>×{item.qty}</span>
                                  <span style={{ textAlign: 'right', fontWeight: 700 }}>
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.subtotal)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Prescription detail if linked */}
                            {t.prescription && t.prescription.details && t.prescription.details.length > 0 && (
                              <div className="trx-rx-linked">
                                <div className="trx-rx-title">🔬 Resep Terkait — {lensType || '-'} | PD: {t.prescription.pd ?? '—'} mm</div>
                                <div className="trx-rx-grid">
                                  <div className="trx-rx-header"><span>Mata</span><span>SPH</span><span>CYL</span><span>AXIS</span><span>ADD</span></div>
                                  {t.prescription.details.map((d: any, i: number) => (
                                    <div key={i} className={`trx-rx-row ${d.eye === 'R' ? 'row-od' : 'row-os'}`}>
                                      <span><strong>{d.eye === 'R' ? 'OD' : 'OS'}</strong></span>
                                      <span>{d.sph > 0 ? `+${Number(d.sph).toFixed(2)}` : Number(d.sph).toFixed(2)}</span>
                                      <span>{d.cyl ? (d.cyl > 0 ? `+${Number(d.cyl).toFixed(2)}` : Number(d.cyl).toFixed(2)) : '—'}</span>
                                      <span>{d.axis != null ? `${d.axis}°` : '—'}</span>
                                      <span>{d.add_power ? `+${Number(d.add_power).toFixed(2)}` : '—'}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Totals & action */}
                            <div className="trx-totals-row">
                              <div className="trx-totals-block">
                                {t.discount > 0 && <div className="trx-total-line"><span>Diskon</span><span>- {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(t.discount)}</span></div>}
                                <div className="trx-total-line bold"><span>Total</span><span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(t.total_amount)}</span></div>
                                <div className="trx-total-line"><span>Dibayar ({t.payment_method.toUpperCase()})</span><span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(t.paid_amount)}</span></div>
                                {t.remaining_amount > 0 && <div className="trx-total-line text-danger"><span>Sisa</span><span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(t.remaining_amount)}</span></div>}
                              </div>
                              <button
                                className="btn btn-primary btn-sm trx-invoice-btn"
                                onClick={(e) => { e.stopPropagation(); setInvoiceTrx(t); }}
                              >
                                <Eye size={14} /> Lihat Invoice
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ClinicalFormModal
        isOpen={isClinicalModalOpen}
        onClose={() => setIsClinicalModalOpen(false)}
        type={clinicalModalType}
        patientId={patient.id}
        onSave={async (exam, prescription) => {
          const payload = {
            exam: {
              patient_id: patient.id,
              source: exam.source,
              exam_date: exam.exam_date,
              doctor_name: exam.doctor_name || undefined,
              facility_name: exam.facility_name || undefined,
              reference_number: exam.reference_number || undefined,
              notes: exam.notes || undefined,
            },
            prescription: {
              type: prescription.type,
              pd: prescription.pd || undefined,
              details: prescription.details.map((d: any) => ({
                eye: d.eye,
                sph: Number(d.sph),
                cyl: Number(d.cyl) || undefined,
                axis: Number(d.axis) || undefined,
                add_power: Number(d.add_power) || undefined,
              })),
            },
          };
          await saveExamMutation.mutateAsync(payload);
        }}
      />

      {/* Invoice Preview Modal */}
      {invoiceTrx && (
        <InvoiceModal
          trx={invoiceTrx}
          onClose={() => setInvoiceTrx(null)}
        />
      )}
    </div>
  );
};

export default PatientDetail;
