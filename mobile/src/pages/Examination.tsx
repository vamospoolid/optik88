import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Plus, Check, X, ShieldAlert, Sparkles, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { examinationsService, patientsService } from '../services/api';

export default function Examination() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'history' | 'compare'>('history');
  const [search, setSearch] = useState('');

  // Accordion open states
  const [openPatientId, setOpenPatientId] = useState<string | null>(null);

  // Compare Tab states
  const [comparePatientId, setComparePatientId] = useState<string>('');
  const [selectedExams, setSelectedExams] = useState<string[]>([]);

  // Auto-fill from URL parameters if requested
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const patientIdParam = searchParams.get('patientId');
    if (tabParam === 'compare') {
      setActiveTab('compare');
      if (patientIdParam) {
        setComparePatientId(patientIdParam);
      }
    }
  }, [searchParams]);

  // Add Exam form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formPatientId, setFormPatientId] = useState('');
  const [source, setSource] = useState<'internal' | 'external'>('internal');
  const [extType, setExtType] = useState<'monofocal' | 'bifocal' | 'progressive'>('monofocal');
  const [doctorName, setDoctorName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');

  // OD Rx
  const [odSph, setOdSph] = useState('0.00');
  const [odCyl, setOdCyl] = useState('0.00');
  const [odAxis, setOdAxis] = useState('0');
  const [odAdd, setOdAdd] = useState('0.00');
  const [odPd, setOdPd] = useState('0.0');

  // OS Rx
  const [osSph, setOsSph] = useState('0.00');
  const [osCyl, setOsCyl] = useState('0.00');
  const [osAxis, setOsAxis] = useState('0');
  const [osAdd, setOsAdd] = useState('0.00');
  const [osPd, setOsPd] = useState('0.0');

  // Queries
  const { data: examinations = [] } = useQuery<any[]>({
    queryKey: ['examinations'],
    queryFn: examinationsService.getAll,
  });

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ['patients'],
    queryFn: patientsService.getAll,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: examinationsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examinations'] });
      handleCloseForm();
    },
  });

  const handleCloseForm = () => {
    setShowAddForm(false);
    // Reset fields
    setFormPatientId('');
    setSource('internal');
    setExtType('monofocal');
    setDoctorName('');
    setFacilityName('');
    setRefNumber('');
    setNotes('');
    setOdSph('0.00'); setOdCyl('0.00'); setOdAxis('0'); setOdAdd('0.00'); setOdPd('0.0');
    setOsSph('0.00'); setOsCyl('0.00'); setOsAxis('0'); setOsAdd('0.00'); setOsPd('0.0');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId) return;

    // Build exam object
    const examPayload = {
      patient_id: formPatientId,
      source,
      exam_date: new Date().toISOString().split('T')[0],
      external_source_type: source === 'external' ? extType : undefined,
      doctor_name: source === 'external' ? doctorName : undefined,
      facility_name: source === 'external' ? facilityName : undefined,
      reference_number: source === 'external' ? refNumber : undefined,
      notes: notes.trim() || undefined,
    };

    // Build prescription object matching backend schema
    const prescriptionPayload = {
      type: source === 'external' ? extType : 'monofocal' as const,
      pd: Math.round((parseFloat(odPd) + parseFloat(osPd)) / 2) || 64,
      details: [
        { eye: 'R' as const, sph: parseFloat(odSph), cyl: parseFloat(odCyl) || undefined, axis: parseInt(odAxis) || undefined, add_power: parseFloat(odAdd) || undefined },
        { eye: 'L' as const, sph: parseFloat(osSph), cyl: parseFloat(osCyl) || undefined, axis: parseInt(osAxis) || undefined, add_power: parseFloat(osAdd) || undefined },
      ],
    };

    createMutation.mutate({ exam: examPayload, prescription: prescriptionPayload });
  };

  // Group examinations by patient
  const groupedHistory = useMemo(() => {
    const map = new Map<string, any[]>();
    examinations.forEach(ex => {
      const list = map.get(ex.patient_id) || [];
      list.push(ex);
      map.set(ex.patient_id, list);
    });

    const result: any[] = [];
    patients.forEach(pat => {
      const list = map.get(pat.id) || [];
      if (list.length > 0 || pat.name.toLowerCase().includes(search.toLowerCase())) {
        // Sort exams by date desc
        list.sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
        result.push({
          patient: pat,
          exams: list,
        });
      }
    });

    return result;
  }, [examinations, patients, search]);

  const currentPatientExams = useMemo(() => {
    if (!comparePatientId) return [];
    return examinations
      .filter(ex => ex.patient_id === comparePatientId)
      .sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
  }, [examinations, comparePatientId]);

  const handleSelectExam = (id: string) => {
    if (selectedExams.includes(id)) {
      setSelectedExams(selectedExams.filter(item => item !== id));
    } else {
      if (selectedExams.length >= 2) {
        setSelectedExams([selectedExams[1], id]);
      } else {
        setSelectedExams([...selectedExams, id]);
      }
    }
  };

  const comparisonData = useMemo(() => {
    if (selectedExams.length < 2) return null;
    const exA = examinations.find(e => e.id === selectedExams[0]);
    const exB = examinations.find(e => e.id === selectedExams[1]);
    if (!exA || !exB) return null;

    // A is oldest, B is newest based on date
    const dateA = new Date(exA.exam_date).getTime();
    const dateB = new Date(exB.exam_date).getTime();
    const oldest = dateA < dateB ? exA : exB;
    const newest = dateA >= dateB ? exA : exB;

    const oldOD = oldest.prescription?.details?.find((d: any) => d.eye === 'R');
    const newOD = newest.prescription?.details?.find((d: any) => d.eye === 'R');
    const oldOS = oldest.prescription?.details?.find((d: any) => d.eye === 'L');
    const newOS = newest.prescription?.details?.find((d: any) => d.eye === 'L');

    const odDiffSph = ((newOD?.sph ?? 0) - (oldOD?.sph ?? 0));
    const osDiffSph = ((newOS?.sph ?? 0) - (oldOS?.sph ?? 0));

    return {
      oldest,
      newest,
      oldOD, newOD,
      oldOS, newOS,
      odDiffSph,
      osDiffSph,
    };
  }, [selectedExams, examinations]);

  return (
    <div className="page-scroll animate-fade-in" style={{ paddingBottom: '6rem' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <span className="top-bar-title">Pemeriksaan Refraksi</span>
        <button className="top-bar-action" onClick={() => setShowAddForm(true)}>
          <Plus size={20} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        <button
          className={`tab-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Riwayat Periksa
        </button>
        <button
          className={`tab-item ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('compare');
            setSelectedExams([]);
          }}
        >
          Komparasi Visual
        </button>
      </div>

      {activeTab === 'history' && (
        <>
          {/* Search bar */}
          <div className="search-bar">
            <Search size={18} className="text-secondary" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama pasien..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Grouped Accordions list */}
          <div className="card-list" style={{ padding: '0 1rem' }}>
            {groupedHistory.map(({ patient, exams }) => {
              const isOpen = openPatientId === patient.id;
              return (
                <div key={patient.id} className="accordion-group" style={{ marginBottom: '0.75rem' }}>
                  <div
                    className="accordion-header ripple"
                    style={{ background: isOpen ? 'var(--primary-light)' : 'var(--surface)', display: 'flex', justifyContent: 'space-between', width: '100%' }}
                    onClick={() => setOpenPatientId(isOpen ? null : patient.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: patient.bpjs_number ? 'var(--info)' : 'var(--primary)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700
                      }}>
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{patient.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{exams.length} kali pemeriksaan</div>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>

                  <div className={`accordion-body ${isOpen ? 'open' : ''}`}>
                    <div style={{ padding: '0.75rem', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {exams.map((ex: any) => (
                        <div key={ex.id} style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              📅 {new Date(ex.exam_date).toLocaleDateString('id-ID')}
                            </span>
                            <span className={`badge ${ex.source === 'internal' ? 'badge-blue' : 'badge-yellow'}`}>
                              {ex.source === 'internal' ? 'Internal' : 'Rujukan'}
                            </span>
                          </div>

                          {ex.doctor_name && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                              🩺 <strong>Dr: {ex.doctor_name}</strong> ({ex.facility_name || 'RS/Klinik'})
                            </div>
                          )}

                          {/* OD / OS grid view — data from prescription.details array */}
                          {(() => {
                            const od = ex.prescription?.details?.find((d: any) => d.eye === 'R');
                            const os = ex.prescription?.details?.find((d: any) => d.eye === 'L');
                            const pd = ex.prescription?.pd;
                            return (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                                <div style={{ background: 'var(--bg)', padding: '8px', borderRadius: '8px' }}>
                                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>MATA KANAN (OD)</div>
                                  <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span>Sph: <strong>{od?.sph ?? '—'}</strong></span>
                                    <span>Cyl: <strong>{od?.cyl ?? '—'}</strong></span>
                                    <span>Axis: <strong>{od?.axis != null ? `${od.axis}°` : '—'}</strong></span>
                                    <span>Add: <strong>{od?.add_power ?? '—'}</strong></span>
                                    <span>PD: <strong>{pd != null ? `${pd} mm` : '—'}</strong></span>
                                  </div>
                                </div>
                                <div style={{ background: 'var(--bg)', padding: '8px', borderRadius: '8px' }}>
                                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#A855F7', marginBottom: '4px' }}>MATA KIRI (OS)</div>
                                  <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span>Sph: <strong>{os?.sph ?? '—'}</strong></span>
                                    <span>Cyl: <strong>{os?.cyl ?? '—'}</strong></span>
                                    <span>Axis: <strong>{os?.axis != null ? `${os.axis}°` : '—'}</strong></span>
                                    <span>Add: <strong>{os?.add_power ?? '—'}</strong></span>
                                    <span>PD: <strong>{pd != null ? `${pd} mm` : '—'}</strong></span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {ex.notes && (
                            <div style={{ marginTop: '8px', background: '#F1F5F9', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                              💬 Catatan: {ex.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'compare' && (
        <div style={{ padding: '1rem' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Pilih Pasien Terlebih Dahulu</label>
            <select
              className="form-control"
              value={comparePatientId}
              onChange={e => {
                setComparePatientId(e.target.value);
                setSelectedExams([]);
              }}
            >
              <option value="">-- Pilih Pasien --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {comparePatientId && currentPatientExams.length === 0 && (
            <div className="card text-center text-secondary">
              Pasien ini belum memiliki catatan riwayat refraksi klinis.
            </div>
          )}

          {comparePatientId && currentPatientExams.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span className="section-title">Pilih 2 Hasil Rekam Refraksi</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {currentPatientExams.map((ex: any) => {
                  const isChecked = selectedExams.includes(ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => handleSelectExam(ex.id)}
                      className="card ripple"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: isChecked ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: isChecked ? 'var(--primary-light)' : 'var(--surface)',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                          📅 {new Date(ex.exam_date).toLocaleDateString('id-ID')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Source: {ex.source === 'internal' ? 'Optik Internal' : 'Resep Rujukan Luar'}
                        </div>
                      </div>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isChecked ? 'var(--primary)' : 'transparent', color: 'white' }}>
                        {isChecked && <Check size={14} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comparation visual matrix display */}
          {comparisonData && (
            <div className="card animate-fade-in" style={{ marginTop: '1.5rem', background: '#F8FAFC', border: '1px dashed var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Sparkles className="text-primary animate-pulse" size={18} />
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800 }}>ANALISIS DELTA PERUBAHAN VISUAL</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* OD Analysis */}
                <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>MATA KANAN (OD) DELTA</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.8125rem' }}>
                      Old: <strong>{comparisonData.oldOD?.sph ?? '—'}</strong> → New: <strong>{comparisonData.newOD?.sph ?? '—'}</strong>
                    </span>
                    <span className={`badge ${comparisonData.odDiffSph === 0 ? 'badge-gray' : comparisonData.odDiffSph > 0 ? 'badge-red' : 'badge-green'}`}>
                      {comparisonData.odDiffSph > 0 ? `+${comparisonData.odDiffSph.toFixed(2)}` : comparisonData.odDiffSph.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* OS Analysis */}
                <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A855F7' }}>MATA KIRI (OS) DELTA</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.8125rem' }}>
                      Old: <strong>{comparisonData.oldOS?.sph ?? '—'}</strong> → New: <strong>{comparisonData.newOS?.sph ?? '—'}</strong>
                    </span>
                    <span className={`badge ${comparisonData.osDiffSph === 0 ? 'badge-gray' : comparisonData.osDiffSph > 0 ? 'badge-red' : 'badge-green'}`}>
                      {comparisonData.osDiffSph > 0 ? `+${comparisonData.osDiffSph.toFixed(2)}` : comparisonData.osDiffSph.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', background: 'var(--primary-light)', padding: '8px', borderRadius: '8px', display: 'flex', gap: '6px' }}>
                  <ShieldAlert size={16} style={{ flexShrink: 0, color: 'var(--primary)' }} />
                  <span>
                    Perubahan nilai minus/plus yang signifikan menunjukkan pasien memerlukan pembaruan pada lensa kacamata mereka secara periodik.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB add exam record */}
      <button className="fab" onClick={() => setShowAddForm(true)} aria-label="Tambah Rekam">
        <Plus size={24} />
      </button>

      {/* Bottom Sheet New Examination */}
      {showAddForm && (
        <>
          <div className="sheet-backdrop" onClick={handleCloseForm} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <span className="sheet-title">Catat Hasil Refraksi Baru</span>
              <button className="sheet-close" onClick={handleCloseForm}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="sheet-body" style={{ background: '#F8FAFC', padding: '1.25rem', paddingBottom: '2.5rem' }}>
                {/* Patient & Source Selection */}
                <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', marginBottom: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 700 }}>Pilih Pasien *</label>
                    <div style={{ position: 'relative' }}>
                      <select
                        className="form-control"
                        value={formPatientId}
                        onChange={e => setFormPatientId(e.target.value)}
                        required
                        style={{ appearance: 'none', background: '#F1F5F9', border: '1px solid transparent', fontWeight: 600, paddingRight: '2.5rem' }}
                      >
                        <option value="">-- Pilih Pasien --</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sumber Resep</label>
                    <div className="flex" style={{ background: '#F1F5F9', borderRadius: '12px', padding: '4px', gap: '4px' }}>
                      <button
                        type="button"
                        className="flex-1 btn btn-sm"
                        style={{
                          borderRadius: '8px',
                          background: source === 'internal' ? 'var(--surface)' : 'transparent',
                          color: source === 'internal' ? 'var(--primary)' : 'var(--text-secondary)',
                          boxShadow: source === 'internal' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                          fontWeight: source === 'internal' ? 700 : 500,
                          padding: '0.625rem 0.5rem',
                        }}
                        onClick={() => setSource('internal')}
                      >
                        Pemeriksaan Internal
                      </button>
                      <button
                        type="button"
                        className="flex-1 btn btn-sm"
                        style={{
                          borderRadius: '8px',
                          background: source === 'external' ? 'var(--surface)' : 'transparent',
                          color: source === 'external' ? 'var(--primary)' : 'var(--text-secondary)',
                          boxShadow: source === 'external' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                          fontWeight: source === 'external' ? 700 : 500,
                          padding: '0.625rem 0.5rem',
                        }}
                        onClick={() => setSource('external')}
                      >
                        Resep Luar / Rujukan
                      </button>
                    </div>
                  </div>
                </div>

                {source === 'external' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', background: '#FFFBEB', borderRadius: '16px', border: '1px solid #FEF3C7', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <ShieldAlert size={18} style={{ color: '#D97706' }} />
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#D97706', margin: 0 }}>DATA RUJUKAN LUAR</h4>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#92400E' }}>Jenis Lensa *</label>
                      <select className="form-control" value={extType} onChange={e => setExtType(e.target.value as any)} style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #FDE68A' }}>
                        <option value="monofocal">Monofocal</option>
                        <option value="bifocal">Bifocal</option>
                        <option value="progressive">Progressive</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#92400E' }}>Nama Dokter / Refraksionis *</label>
                      <input type="text" className="form-control" placeholder="Nama Dr. / Dr. Sp.M" value={doctorName} onChange={e => setDoctorName(e.target.value)} required style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #FDE68A' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#92400E' }}>Fasilitas Kesehatan *</label>
                      <input type="text" className="form-control" placeholder="Nama RS / Klinik" value={facilityName} onChange={e => setFacilityName(e.target.value)} required style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #FDE68A' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#92400E' }}>Nomor Referensi Resep</label>
                      <input type="text" className="form-control" placeholder="No. Resep (opsional)" value={refNumber} onChange={e => setRefNumber(e.target.value)} style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #FDE68A' }} />
                    </div>
                  </div>
                )}

                {/* Refraction Data */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  {/* OD Card */}
                  <div style={{ 
                    background: 'linear-gradient(to right, rgba(43,53,232,0.04), #ffffff)', 
                    borderRadius: '16px', 
                    padding: '1.25rem', 
                    border: '1px solid rgba(43,53,232,0.1)',
                    borderLeft: '5px solid var(--primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, boxShadow: '0 2px 8px rgba(43,53,232,0.3)' }}>R</div>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>MATA KANAN (OD)</h4>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.6875rem', textAlign: 'center', letterSpacing: '0.5px' }}>SPH</label>
                        <input type="text" className="form-control" style={{ textAlign: 'center', fontWeight: 700, background: '#F8FAFC', padding: '0.625rem', border: '1px solid #E2E8F0' }} value={odSph} onChange={e => setOdSph(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.6875rem', textAlign: 'center', letterSpacing: '0.5px' }}>CYL</label>
                        <input type="text" className="form-control" style={{ textAlign: 'center', fontWeight: 700, background: '#F8FAFC', padding: '0.625rem', border: '1px solid #E2E8F0' }} value={odCyl} onChange={e => setOdCyl(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.6875rem', textAlign: 'center', letterSpacing: '0.5px' }}>AXIS</label>
                        <input type="text" className="form-control" style={{ textAlign: 'center', fontWeight: 700, background: '#F8FAFC', padding: '0.625rem', border: '1px solid #E2E8F0' }} value={odAxis} onChange={e => setOdAxis(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.6875rem', textAlign: 'center', letterSpacing: '0.5px' }}>ADD</label>
                        <input type="text" className="form-control" style={{ textAlign: 'center', fontWeight: 700, background: '#F8FAFC', padding: '0.625rem', border: '1px solid #E2E8F0' }} value={odAdd} onChange={e => setOdAdd(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.6875rem', textAlign: 'center', letterSpacing: '0.5px' }}>PD (Pupil Dist)</label>
                        <input type="text" className="form-control" style={{ textAlign: 'center', fontWeight: 700, background: '#F8FAFC', padding: '0.625rem', border: '1px solid #E2E8F0' }} value={odPd} onChange={e => setOdPd(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* OS Card */}
                  <div style={{ 
                    background: 'linear-gradient(to right, rgba(168,85,247,0.04), #ffffff)', 
                    borderRadius: '16px', 
                    padding: '1.25rem', 
                    border: '1px solid rgba(168,85,247,0.1)',
                    borderLeft: '5px solid #A855F7',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#A855F7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, boxShadow: '0 2px 8px rgba(168,85,247,0.3)' }}>L</div>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#A855F7', margin: 0 }}>MATA KIRI (OS)</h4>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.6875rem', textAlign: 'center', letterSpacing: '0.5px' }}>SPH</label>
                        <input type="text" className="form-control" style={{ textAlign: 'center', fontWeight: 700, background: '#F8FAFC', padding: '0.625rem', border: '1px solid #E2E8F0' }} value={osSph} onChange={e => setOsSph(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.6875rem', textAlign: 'center', letterSpacing: '0.5px' }}>CYL</label>
                        <input type="text" className="form-control" style={{ textAlign: 'center', fontWeight: 700, background: '#F8FAFC', padding: '0.625rem', border: '1px solid #E2E8F0' }} value={osCyl} onChange={e => setOsCyl(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.6875rem', textAlign: 'center', letterSpacing: '0.5px' }}>AXIS</label>
                        <input type="text" className="form-control" style={{ textAlign: 'center', fontWeight: 700, background: '#F8FAFC', padding: '0.625rem', border: '1px solid #E2E8F0' }} value={osAxis} onChange={e => setOsAxis(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.6875rem', textAlign: 'center', letterSpacing: '0.5px' }}>ADD</label>
                        <input type="text" className="form-control" style={{ textAlign: 'center', fontWeight: 700, background: '#F8FAFC', padding: '0.625rem', border: '1px solid #E2E8F0' }} value={osAdd} onChange={e => setOsAdd(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.6875rem', textAlign: 'center', letterSpacing: '0.5px' }}>PD (Pupil Dist)</label>
                        <input type="text" className="form-control" style={{ textAlign: 'center', fontWeight: 700, background: '#F8FAFC', padding: '0.625rem', border: '1px solid #E2E8F0' }} value={osPd} onChange={e => setOsPd(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Catatan Tambahan Klinis</label>
                  <textarea 
                    className="form-control" 
                    placeholder="Tulis keluhan pasien, riwayat alergi, atau rekomendasi tipe lensa (opsional)..." 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    style={{ background: 'var(--surface)', minHeight: '100px', border: '1px solid #CBD5E1', borderRadius: '12px' }}
                  />
                </div>

                <div style={{ 
                  position: 'sticky', 
                  bottom: '-2rem', 
                  background: 'linear-gradient(to top, #F8FAFC 80%, transparent)', 
                  paddingTop: '2rem', 
                  marginTop: '0.5rem',
                  zIndex: 10
                }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-full ripple"
                    style={{ height: '54px', fontSize: '1rem', borderRadius: '16px', boxShadow: '0 8px 24px rgba(43,53,232,0.35)' }}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Menyimpan Data...
                      </>
                    ) : (
                      <>
                        <Check size={20} />
                        Simpan Hasil Refraksi
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
