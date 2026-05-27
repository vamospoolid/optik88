import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsService, examinationsService } from '../services/api';
import type { Patient } from 'optik88-shared';
import { Search, Activity, ArrowRightLeft, AlertCircle, Loader2, Plus, Eye, FileText, User, ChevronDown } from 'lucide-react';
import ClinicalFormModal from '../components/ClinicalFormModal';
import './Examination.css';

// ── Domain Types ──────────────────────────────────────────
interface RxDetail {
  eye: 'R' | 'L';
  sph?: number;
  cyl?: number;
  axis?: number;
  add_power?: number;
}

interface Prescription {
  type?: string;
  pd?: number;
  details?: RxDetail[];
}

interface ExamRecord {
  id: string;
  patient_id: string;
  source: 'internal' | 'external';
  exam_date: string;
  doctor_name?: string;
  facility_name?: string;
  reference_number?: string;
  notes?: string;
  prescription?: Prescription;
}

const fmt = (v?: number) => v !== undefined ? (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)) : '—';
const fmtAxis = (v?: number) => v !== undefined ? `${v}°` : '—';

const Examination: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [compExamIdInt, setCompExamIdInt] = useState('');
  const [compExamIdExt, setCompExamIdExt] = useState('');
  const [activeTab, setActiveTab] = useState<'riwayat' | 'komparasi'>('riwayat');
  const [isNewExamModalOpen, setIsNewExamModalOpen] = useState(false);
  const [newExamPatient, setNewExamPatient] = useState<Patient | null>(null);
  const [newExamType, setNewExamType] = useState<'internal' | 'external'>('internal');
  const [showPatientPicker, setShowPatientPicker] = useState(false);

  // Accordion states
  const [expandedPatients, setExpandedPatients] = useState<Record<string, boolean>>({});
  const [expandedExams, setExpandedExams] = useState<Record<string, boolean>>({});

  const togglePatient = (patientId: string) => {
    setExpandedPatients(prev => ({ ...prev, [patientId]: prev[patientId] === false ? true : false }));
  };

  const toggleExam = (examId: string) => {
    setExpandedExams(prev => ({ ...prev, [examId]: !prev[examId] }));
  };

  const { data: patients = [], isLoading: loadPatients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: patientsService.getAll,
  });

  const { data: exams = [], isLoading: loadExams, isError } = useQuery<ExamRecord[]>({
    queryKey: ['examinations'],
    queryFn: () => examinationsService.getAll(),
  });

  const saveExamMutation = useMutation({
    mutationFn: examinationsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examinations'] });
      setIsNewExamModalOpen(false);
      setNewExamPatient(null);
    },
  });

  const isLoading = loadPatients || loadExams;

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'Pasien Umum';

  const getPrescriptionByExamId = (examId: string) => exams.find(e => e.id === examId)?.prescription || null;

  const filteredExams = [...exams]
    .sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime())
    .filter(exam => {
      const q = searchQuery.toLowerCase();
      return (
        getPatientName(exam.patient_id).toLowerCase().includes(q) ||
        (exam.notes || '').toLowerCase().includes(q) ||
        (exam.doctor_name || '').toLowerCase().includes(q)
      );
    });

  const groupedExams = filteredExams.reduce((acc, exam) => {
    if (!acc[exam.patient_id]) {
      acc[exam.patient_id] = { patientName: getPatientName(exam.patient_id), exams: [] };
    }
    acc[exam.patient_id].exams.push(exam);
    return acc;
  }, {} as Record<string, { patientName: string; exams: ExamRecord[] }>);

  const handleSaveExam = async (exam: Partial<ExamRecord>, rx: Prescription & { details: RxDetail[] }) => {
    await saveExamMutation.mutateAsync({
      exam: {
        patient_id: exam.patient_id,
        source: exam.source,
        exam_date: exam.exam_date,
        doctor_name: exam.doctor_name || undefined,
        facility_name: exam.facility_name || undefined,
        reference_number: exam.reference_number || undefined,
        notes: exam.notes || undefined,
      },
      prescription: {
        type: rx.type,
        pd: rx.pd || undefined,
        details: rx.details.map((d: RxDetail) => ({
          eye: d.eye,
          sph: Number(d.sph),
          cyl: Number(d.cyl) || undefined,
          axis: Number(d.axis) || undefined,
          add_power: Number(d.add_power) || undefined,
        })),
      },
    });
  };

  const patientExams = selectedPatientId ? exams.filter(e => e.patient_id === selectedPatientId) : [];
  const internalExams = patientExams.filter(e => e.source === 'internal');
  const externalExams = patientExams.filter(e => e.source === 'external');

  const handlePatientCompChange = (patientId: string) => {
    setSelectedPatientId(patientId);
    const pExams = exams.filter(e => e.patient_id === patientId);
    setCompExamIdInt(pExams.find(e => e.source === 'internal')?.id || '');
    setCompExamIdExt(pExams.find(e => e.source === 'external')?.id || '');
  };

  const rxInt = compExamIdInt ? getPrescriptionByExamId(compExamIdInt) : null;
  const rxExt = compExamIdExt ? getPrescriptionByExamId(compExamIdExt) : null;

  const diffClass = (a?: number, b?: number, threshold = 0.75) => {
    if (a === undefined && b === undefined) return 'cell-na';
    if (a === undefined || b === undefined) return 'cell-miss';
    if (a === b) return 'cell-match';
    return Math.abs(a - b) >= threshold ? 'cell-major' : 'cell-diff';
  };


  // Stats
  const totalExams = exams.length;
  const totalInternal = exams.filter(e => e.source === 'internal').length;
  const totalExternal = exams.filter(e => e.source === 'external').length;
  const uniquePatients = new Set(exams.map(e => e.patient_id)).size;

  return (
    <div className="exam-page animate-fade-in">

      {/* ── Header ── */}
      <div className="exam-hero">
        <div className="exam-hero-content">
          <div className="exam-hero-icon">
            <Eye size={28} />
          </div>
          <div>
            <h1>Rekam Refraksi &amp; Klinik</h1>
            <p>Catat pemeriksaan mata, kelola resep rujukan, dan bandingkan hasil secara visual.</p>
          </div>
        </div>
        <div className="exam-hero-stats">
          <div className="hero-stat"><span className="hero-stat-num">{totalExams}</span><span>Total Rekam</span></div>
          <div className="hero-stat-div" />
          <div className="hero-stat"><span className="hero-stat-num text-success">{totalInternal}</span><span>Optik Internal</span></div>
          <div className="hero-stat-div" />
          <div className="hero-stat"><span className="hero-stat-num text-warning">{totalExternal}</span><span>Resep Luar</span></div>
          <div className="hero-stat-div" />
          <div className="hero-stat"><span className="hero-stat-num">{uniquePatients}</span><span>Pasien</span></div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="exam-tab-bar">
        <div className="exam-tabs">
          <button className={`exam-tab ${activeTab === 'riwayat' ? 'active' : ''}`} onClick={() => setActiveTab('riwayat')}>
            <Activity size={16} /> Riwayat Pemeriksaan
          </button>
          <button className={`exam-tab ${activeTab === 'komparasi' ? 'active' : ''}`} onClick={() => setActiveTab('komparasi')}>
            <ArrowRightLeft size={16} /> Komparasi Resep
          </button>
        </div>

        {activeTab === 'riwayat' && (
          <div className="exam-toolbar">
            <div className="exam-search-wrap">
              <Search size={16} className="exam-search-icon" />
              <input
                className="exam-search"
                placeholder="Cari pasien, dokter, catatan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="exam-new-dropdown">
              <button className="btn-exam-new" onClick={() => setShowPatientPicker(v => !v)}>
                <Plus size={16} /> Pemeriksaan Baru <ChevronDown size={14} />
              </button>
              {showPatientPicker && (
                <div className="patient-picker-dropdown animate-fade-in">
                  <div className="picker-header">Pilih pasien &amp; jenis pemeriksaan</div>
                  {patients.map(p => (
                    <div key={p.id} className="picker-patient-row">
                      <div className="picker-patient-info">
                        <div className="picker-avatar">{p.name.charAt(0)}</div>
                        <div>
                          <div className="picker-name">{p.name}</div>
                          <div className="picker-id">{p.id} · {p.phone || '—'}</div>
                        </div>
                      </div>
                      <div className="picker-actions">
                        <button className="picker-btn-int" onClick={() => { setNewExamPatient(p); setNewExamType('internal'); setIsNewExamModalOpen(true); setShowPatientPicker(false); }}>
                          <Eye size={12} /> Optik
                        </button>
                        <button className="picker-btn-ext" onClick={() => { setNewExamPatient(p); setNewExamType('external'); setIsNewExamModalOpen(true); setShowPatientPicker(false); }}>
                          <FileText size={12} /> Rujukan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      {isLoading ? (
        <div className="exam-loading">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p>Memuat catatan rekam medis...</p>
        </div>
      ) : isError ? (
        <div className="exam-error-state">
          <AlertCircle size={36} />
          <h3>Gagal memuat rekam medis</h3>
          <p>Tidak dapat menghubungkan ke server backend.</p>
        </div>
      ) : activeTab === 'riwayat' ? (

        /* ══ RIWAYAT TAB ══ */
        <div className="exam-grouped-list">
          {Object.keys(groupedExams).length === 0 ? (
            <div className="exam-empty">
              <Eye size={48} strokeWidth={1} />
              <h3>Belum ada rekam medis</h3>
              <p>Mulai tambah pemeriksaan dengan tombol "Pemeriksaan Baru" di atas.</p>
            </div>
          ) : (
            Object.entries(groupedExams).map(([patientId, group]) => (
              <div key={patientId} className="patient-exam-group">
                {/* Header Group */}
                <div className="patient-exam-group-header" onClick={() => togglePatient(patientId)} style={{ cursor: 'pointer' }}>
                  <div className="pe-avatar">
                    {group.patientName.charAt(0)}
                  </div>
                  <div className="pe-info">
                    <div className="pe-name">{group.patientName}</div>
                    <div className="pe-id">{patientId}</div>
                  </div>
                  <div className="pe-count-badge">
                    {group.exams.length} Pemeriksaan
                  </div>
                  <ChevronDown size={20} className="pe-chevron" style={{ marginLeft: 'auto', color: '#94a3b8', transform: expandedPatients[patientId] === false ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>

                {/* Timeline */}
                {expandedPatients[patientId] !== false && (
                <div className="patient-exam-timeline animate-slide-down">
                  {group.exams.map((exam) => {
                    const isExt = exam.source === 'external';
                    const rx = exam.prescription;
                    const od = rx?.details?.find((d: RxDetail) => d.eye === 'R');
                    const os = rx?.details?.find((d: RxDetail) => d.eye === 'L');

                    return (
                      <div key={exam.id} className={`timeline-item ${isExt ? 'ext' : 'int'}`}>
                        <div className="timeline-dot" />
                        
                        <div className="timeline-item-summary" onClick={() => toggleExam(exam.id)}>
                          <div className="timeline-item-header">
                            <div className="timeline-date">{new Date(exam.exam_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            <div className={`exam-source-badge ${isExt ? 'badge-ext' : 'badge-int'}`}>
                              {isExt ? <><FileText size={11} /> Resep Dokter Luar</> : <><Eye size={11} /> Periksa Optik</>}
                            </div>
                            {isExt && exam.doctor_name && <span className="exam-meta-item"><User size={12} /> Dr. {exam.doctor_name}</span>}
                            {isExt && exam.facility_name && <span className="exam-meta-item fac">{exam.facility_name}</span>}
                            <ChevronDown size={18} style={{ marginLeft: 'auto', color: '#94a3b8', transform: expandedExams[exam.id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                          </div>

                          {/* Meta row */}
                          <div className="exam-card-meta">
                            {rx?.type && <span className="exam-meta-item lens-type">{rx.type}</span>}
                            {rx?.pd && <span className="exam-meta-item">PD: {rx.pd} mm</span>}
                            {!expandedExams[exam.id] && rx && <span className="exam-meta-item hint" style={{ background: 'transparent', border: '1px dashed #cbd5e1' }}>Buka detail refraksi</span>}
                          </div>
                        </div>

                        {/* Refraction grid */}
                        {expandedExams[exam.id] && rx && (
                          <div className="exam-rx-grid animate-slide-down">
                            <div className="rx-col-header">
                              <span className="rx-eye-label od-label">OD · Kanan</span>
                              <span className="rx-eye-label os-label">OS · Kiri</span>
                            </div>
                            <div className="rx-values-row">
                              {/* OD */}
                              <div className="rx-eye-block od-block">
                                <div className="rx-cell"><span className="rx-key">SPH</span><span className="rx-val">{fmt(od?.sph)}</span></div>
                                <div className="rx-cell"><span className="rx-key">CYL</span><span className="rx-val">{fmt(od?.cyl)}</span></div>
                                <div className="rx-cell"><span className="rx-key">AXIS</span><span className="rx-val">{fmtAxis(od?.axis)}</span></div>
                                {od?.add_power !== undefined && <div className="rx-cell"><span className="rx-key">ADD</span><span className="rx-val">{fmt(od?.add_power)}</span></div>}
                              </div>
                              <div className="rx-divider" />
                              {/* OS */}
                              <div className="rx-eye-block os-block">
                                <div className="rx-cell"><span className="rx-key">SPH</span><span className="rx-val">{fmt(os?.sph)}</span></div>
                                <div className="rx-cell"><span className="rx-key">CYL</span><span className="rx-val">{fmt(os?.cyl)}</span></div>
                                <div className="rx-cell"><span className="rx-key">AXIS</span><span className="rx-val">{fmtAxis(os?.axis)}</span></div>
                                {os?.add_power !== undefined && <div className="rx-cell"><span className="rx-key">ADD</span><span className="rx-val">{fmt(os?.add_power)}</span></div>}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {expandedExams[exam.id] && exam.notes && (
                          <div className="exam-notes animate-slide-down">
                            <span className="notes-label">📝</span>
                            <span className="notes-text">{exam.notes}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            ))
          )}
        </div>

      ) : (

        /* ══ KOMPARASI TAB ══ */
        <div className="comp-page">
          {/* Selector */}
          <div className="comp-selector-card">
            <h3 className="comp-selector-title">Pilih Data untuk Dibandingkan</h3>
            <div className="comp-selector-grid">
              <div className="comp-select-group">
                <label className="comp-select-label"><User size={13} /> Pasien</label>
                <select className="form-control" value={selectedPatientId} onChange={e => handlePatientCompChange(e.target.value)}>
                  <option value="" disabled>— Pilih Pasien —</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                </select>
              </div>
              <div className="comp-select-group">
                <label className="comp-select-label"><Eye size={13} /> Periksa Optik Internal</label>
                <select className="form-control" value={compExamIdInt} onChange={e => setCompExamIdInt(e.target.value)} disabled={!selectedPatientId || internalExams.length === 0}>
                  {internalExams.length === 0 ? <option value="">Tidak ada data</option> : internalExams.map(e => <option key={e.id} value={e.id}>{e.exam_date} — Refraksi Internal</option>)}
                </select>
              </div>
              <div className="comp-select-group">
                <label className="comp-select-label"><FileText size={13} /> Resep Dokter Luar</label>
                <select className="form-control" value={compExamIdExt} onChange={e => setCompExamIdExt(e.target.value)} disabled={!selectedPatientId || externalExams.length === 0}>
                  {externalExams.length === 0 ? <option value="">Tidak ada data</option> : externalExams.map(e => <option key={e.id} value={e.id}>{e.exam_date} — Dr. {e.doctor_name || 'Luar'}</option>)}
                </select>
              </div>
            </div>
          </div>

          {!selectedPatientId ? (
            <div className="comp-empty-state">
              <ArrowRightLeft size={48} strokeWidth={1} />
              <h3>Pilih pasien untuk memulai komparasi</h3>
              <p>Sistem akan menampilkan perbandingan resep internal optik vs resep dokter luar secara visual.</p>
            </div>
          ) : (
            <div className="comp-result-layout">
              {/* Legend */}
              <div className="comp-legend">
                <span className="comp-legend-item match">✓ Nilai Sama</span>
                <span className="comp-legend-item diff">≠ Berbeda</span>
                <span className="comp-legend-item major">⚠ Beda Signifikan (≥0.75D)</span>
                <span className="comp-legend-item miss">? Data Tidak Lengkap</span>
              </div>

              {/* Comparison Table */}
              <div className="comp-table-card">
                {/* Column headers */}
                <div className="comp-header-row">
                  <div className="comp-header-param">Parameter</div>
                  <div className="comp-header-int">
                    <div className="comp-header-badge int-badge"><Eye size={14} /> Optik Internal</div>
                    <div className="comp-header-date">{compExamIdInt ? exams.find(e => e.id === compExamIdInt)?.exam_date : '—'}</div>
                  </div>
                  <div className="comp-header-ext">
                    <div className="comp-header-badge ext-badge"><FileText size={14} /> Dokter Luar</div>
                    <div className="comp-header-date">{compExamIdExt ? exams.find(e => e.id === compExamIdExt)?.exam_date : '—'}</div>
                  </div>
                </div>

                {/* OD Section */}
                <div className="comp-section-label">👁 OD — Mata Kanan (Oculus Dexter)</div>
                {[
                  { label: 'SPH (Sphere)', i: rxInt?.details?.find((d: RxDetail)=>d.eye==='R')?.sph, e: rxExt?.details?.find((d: RxDetail)=>d.eye==='R')?.sph, fn: fmt, cmp: diffClass },
                  { label: 'CYL (Cylinder)', i: rxInt?.details?.find((d: RxDetail)=>d.eye==='R')?.cyl, e: rxExt?.details?.find((d: RxDetail)=>d.eye==='R')?.cyl, fn: fmt, cmp: diffClass },
                  { label: 'AXIS', i: rxInt?.details?.find((d: RxDetail)=>d.eye==='R')?.axis, e: rxExt?.details?.find((d: RxDetail)=>d.eye==='R')?.axis, fn: fmtAxis, cmp: (a?: number, b?: number)=>diffClass(a,b,15) },
                  { label: 'ADD (Addition)', i: rxInt?.details?.find((d: RxDetail)=>d.eye==='R')?.add_power, e: rxExt?.details?.find((d: RxDetail)=>d.eye==='R')?.add_power, fn: fmt, cmp: diffClass },
                ].map(row => (
                  <div key={row.label} className={`comp-data-row ${row.cmp(row.i, row.e)}`}>
                    <div className="comp-data-param">{row.label}</div>
                    <div className="comp-data-int">{rxInt ? row.fn(row.i) : '—'}</div>
                    <div className="comp-data-ext">{rxExt ? row.fn(row.e) : '—'}</div>
                  </div>
                ))}

                {/* OS Section */}
                <div className="comp-section-label">👁 OS — Mata Kiri (Oculus Sinister)</div>
                {[
                  { label: 'SPH (Sphere)', i: rxInt?.details?.find((d: RxDetail)=>d.eye==='L')?.sph, e: rxExt?.details?.find((d: RxDetail)=>d.eye==='L')?.sph, fn: fmt, cmp: diffClass },
                  { label: 'CYL (Cylinder)', i: rxInt?.details?.find((d: RxDetail)=>d.eye==='L')?.cyl, e: rxExt?.details?.find((d: RxDetail)=>d.eye==='L')?.cyl, fn: fmt, cmp: diffClass },
                  { label: 'AXIS', i: rxInt?.details?.find((d: RxDetail)=>d.eye==='L')?.axis, e: rxExt?.details?.find((d: RxDetail)=>d.eye==='L')?.axis, fn: fmtAxis, cmp: (a?: number, b?: number)=>diffClass(a,b,15) },
                  { label: 'ADD (Addition)', i: rxInt?.details?.find((d: RxDetail)=>d.eye==='L')?.add_power, e: rxExt?.details?.find((d: RxDetail)=>d.eye==='L')?.add_power, fn: fmt, cmp: diffClass },
                ].map(row => (
                  <div key={row.label} className={`comp-data-row ${row.cmp(row.i, row.e)}`}>
                    <div className="comp-data-param">{row.label}</div>
                    <div className="comp-data-int">{rxInt ? row.fn(row.i) : '—'}</div>
                    <div className="comp-data-ext">{rxExt ? row.fn(row.e) : '—'}</div>
                  </div>
                ))}

                {/* General */}
                <div className="comp-section-label">📋 Umum</div>
                <div className={`comp-data-row ${rxInt?.pd === rxExt?.pd ? 'cell-match' : 'cell-diff'}`}>
                  <div className="comp-data-param">PD (Pupillary Distance)</div>
                  <div className="comp-data-int">{rxInt?.pd ? `${rxInt.pd} mm` : '—'}</div>
                  <div className="comp-data-ext">{rxExt?.pd ? `${rxExt.pd} mm` : '—'}</div>
                </div>
                <div className={`comp-data-row ${rxInt?.type === rxExt?.type ? 'cell-match' : 'cell-diff'}`}>
                  <div className="comp-data-param">Tipe Lensa</div>
                  <div className="comp-data-int" style={{ textTransform: 'capitalize' }}>{rxInt?.type || '—'}</div>
                  <div className="comp-data-ext" style={{ textTransform: 'capitalize' }}>{rxExt?.type || '—'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isNewExamModalOpen && newExamPatient && (
        <ClinicalFormModal
          isOpen={isNewExamModalOpen}
          onClose={() => { setIsNewExamModalOpen(false); setNewExamPatient(null); }}
          patientId={newExamPatient.id}
          type={newExamType}
          onSave={handleSaveExam}
        />
      )}
    </div>
  );
};

export default Examination;
