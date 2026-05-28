import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, UserPlus, Plus, Trash2, Save, CheckCircle, ChevronRight, AlertCircle, Activity, Loader2 } from 'lucide-react';
import type { Patient, PaymentMethod, StockItem } from 'optik88-shared';
import { patientsService, stockService, examinationsService, transactionsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './NewOrder.css';

const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface CartItem {
  id: string;
  product_type: 'frame' | 'lens' | 'service';
  product_id?: string;
  name: string;
  original_price: number;
  sell_price: number;
  qty: number;
  subtotal: number;
}

const STEPS = ['Data Pasien', 'Pemeriksaan Klinis', 'Pilih Produk', 'Pembayaran & Checkout'];

const NewOrderPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initPatientId = searchParams.get('patientId');
  const [step, setStep] = useState(initPatientId ? 1 : 0);

  // ── Step 1: Patient ──
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showNewPatient, setShowNewPatient] = useState(false);
  
  // Patient Form Fields
  const [npName, setNpName] = useState('');
  const [npPhone, setNpPhone] = useState('');
  const [npGender, setNpGender] = useState<'male'|'female'>('male');
  const [npNik, setNpNik] = useState('');
  const [npBirthDate, setNpBirthDate] = useState('');
  const [npAddress, setNpAddress] = useState('');
  const [npType, setNpType] = useState<'umum'|'bpjs'>('umum');
  const [npBpjsNumber, setNpBpjsNumber] = useState('');

  // ── Step 2: Examination ──
  const [skipExam, setSkipExam] = useState(false);
  const [hasExtRx, setHasExtRx] = useState(false);
  const [useExtRxForOrder, setUseExtRxForOrder] = useState(false);

  // Internal Optic Examination
  const [rxDateInt, setRxDateInt] = useState(new Date().toISOString().split('T')[0]);
  const [odInt, setOdInt] = useState({ sph: '0', cyl: '0', axis: '0', add: '0' });
  const [osInt, setOsInt] = useState({ sph: '0', cyl: '0', axis: '0', add: '0' });
  const [pdInt, setPdInt] = useState('64');
  const [typeInt, setTypeInt] = useState<'monofocal'|'bifocal'|'progressive'>('monofocal');
  const [notesInt, setNotesInt] = useState('');

  // External Doctor Prescription
  const [rxDateExt, setRxDateExt] = useState(new Date().toISOString().split('T')[0]);
  const [rxExtSrc, setRxExtSrc] = useState('bpjs');
  const [rxDr, setRxDr] = useState('');
  const [rxFacility, setRxFacility] = useState('');
  const [rxRefNo, setRxRefNo] = useState('');
  const [odExt, setOdExt] = useState({ sph: '0', cyl: '0', axis: '0', add: '0' });
  const [osExt, setOsExt] = useState({ sph: '0', cyl: '0', axis: '0', add: '0' });
  const [pdExt, setPdExt] = useState('64');
  const [typeExt, setTypeExt] = useState<'monofocal'|'bifocal'|'progressive'>('monofocal');
  const [notesExt, setNotesExt] = useState('');

  // ── Step 3: Products ──
  const [stockSearch, setStockSearch] = useState('');
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  // Custom Item Form States
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<'frame'|'lens'|'service'>('lens');
  const [customPrice, setCustomPrice] = useState(0);

  // ── Step 4: Payment ──
  const [payMethod, setPayMethod] = useState<PaymentMethod>('tunai');
  const [payAmount, setPayAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // Queries
  const { data: patients = [], isLoading: loadPatients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: patientsService.getAll,
  });

  const { data: stockItems = [], isLoading: loadStock } = useQuery<StockItem[]>({
    queryKey: ['stock'],
    queryFn: stockService.getAll,
  });

  React.useEffect(() => {
    if (initPatientId && !selectedPatient && patients.length > 0) {
      const found = patients.find(p => p.id === initPatientId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (found) setSelectedPatient(found);
    }
  }, [initPatientId, selectedPatient, patients]);

  // Mutations
  const createPatientMutation = useMutation({
    mutationFn: patientsService.create,
    onSuccess: (newPatient: Patient) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setSelectedPatient(newPatient);
      setShowNewPatient(false);
      setNpName(''); setNpPhone(''); setNpNik(''); setNpBirthDate(''); setNpAddress(''); setNpBpjsNumber(''); setNpType('umum');
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient) return;
      let linkedRxId: string | undefined = undefined;

      if (!skipExam) {
        // 1. Create Internal Exam
        const payloadInt = {
          exam: {
            patient_id: selectedPatient.id,
            source: 'internal' as const,
            exam_date: rxDateInt,
            notes: notesInt || undefined,
          },
          prescription: {
            type: typeInt,
            pd: Number(pdInt),
            details: [
              { eye: 'R' as const, sph: Number(odInt.sph), cyl: Number(odInt.cyl) || undefined, axis: Number(odInt.axis) || undefined, add_power: Number(odInt.add) || undefined },
              { eye: 'L' as const, sph: Number(osInt.sph), cyl: Number(osInt.cyl) || undefined, axis: Number(osInt.axis) || undefined, add_power: Number(osInt.add) || undefined },
            ]
          }
        };
        const resInt = await examinationsService.create(payloadInt);
        linkedRxId = resInt.prescription?.id;

        // 2. Create External Exam
        if (hasExtRx) {
          const payloadExt = {
            exam: {
              patient_id: selectedPatient.id,
              source: 'external' as const,
              external_source_type: rxExtSrc,
              doctor_name: rxDr || undefined,
              facility_name: rxFacility || undefined,
              reference_number: rxRefNo || undefined,
              exam_date: rxDateExt,
              notes: notesExt || undefined,
            },
            prescription: {
              type: typeExt,
              pd: Number(pdExt),
              details: [
                { eye: 'R' as const, sph: Number(odExt.sph), cyl: Number(odExt.cyl) || undefined, axis: Number(odExt.axis) || undefined, add_power: Number(odExt.add) || undefined },
                { eye: 'L' as const, sph: Number(osExt.sph), cyl: Number(osExt.cyl) || undefined, axis: Number(osExt.axis) || undefined, add_power: Number(osExt.add) || undefined },
              ]
            }
          };
          const resExt = await examinationsService.create(payloadExt);
          if (useExtRxForOrder) {
            linkedRxId = resExt.prescription?.id;
          }
        }
      }

      // 3. Create Transaction
      const payStatus = payAmount === 0 ? 'belum_bayar' : payAmount >= total ? 'lunas' : 'dp';
      const trxPayload = {
        patient_id: selectedPatient.id,
        prescription_id: linkedRxId,
        discount,
        paid_amount: payAmount,
        payment_method: payMethod,
        payment_status: payStatus,
        notes: notes || undefined,
        created_by: user?.name ?? 'Sistem',
        items: items.map(item => ({
          product_type: item.product_type,
          product_id: item.product_id || undefined,
          name: item.name,
          original_price: item.original_price,
          sell_price: item.sell_price,
          qty: item.qty
        }))
      };

      return transactionsService.create(trxPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['examinations'] });
      navigate('/transaksi');
    }
  });

  // Derived values
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const total = Math.max(0, subtotal - discount);
  const diff = total - payAmount;
  
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.phone ?? '').includes(patientSearch) ||
    (p.nik ?? '').includes(patientSearch) ||
    (p.bpjs_number ?? '').includes(patientSearch)
  );

  const filteredStock = stockItems.filter(s =>
    (s.name + ' ' + s.brand + ' ' + (s.sku || '')).toLowerCase().includes(stockSearch.toLowerCase())
  );

  // ── Handlers ──
  const saveNewPatient = async () => {
    if (!npName.trim()) return;
    const p: Partial<Patient> = {
      name: npName.trim(),
      phone: npPhone || undefined,
      gender: npGender,
      nik: npNik || undefined,
      birth_date: npBirthDate || undefined,
      address: npAddress || undefined,
      bpjs_number: npType === 'bpjs' ? npBpjsNumber : undefined
    };
    await createPatientMutation.mutateAsync(p);
  };

  const addItem = (s: StockItem) => {
    setItems(prev => {
      const ex = prev.find(i => i.product_id === s.id);
      if (ex) return prev.map(i => i.product_id === s.id ? { ...i, qty: i.qty+1, subtotal:(i.qty+1)*i.sell_price } : i);
      return [...prev, {
        id: `TI${Date.now()}`,
        product_type: s.category,
        product_id: s.id,
        name: `${s.brand} ${s.name}${s.color ? ` (${s.color})` : ''}`,
        original_price: s.sell_price,
        sell_price: s.sell_price,
        qty: 1,
        subtotal: s.sell_price
      }];
    });
  };

  const addCustomItem = (name: string, category: 'frame' | 'lens' | 'service', price: number) => {
    setItems(prev => [...prev, {
      id: `TI-CUSTOM-${Date.now()}`,
      product_type: category,
      name: name,
      original_price: price,
      sell_price: price,
      qty: 1,
      subtotal: price
    }]);
  };

  const handleSave = () => {
    checkoutMutation.mutate();
  };

  const canNext = [
    !!selectedPatient,
    true,
    true,
    true,
  ];

  const pageLoading = loadPatients || loadStock;

  return (
    <div className="new-order-page">
      {/* Header */}
      <div className="page-header-wizard">
        <button className="btn btn-secondary btn-back" onClick={() => navigate('/transaksi')}>
          <ArrowLeft size={16} /> Kembali ke Transaksi
        </button>
        <div className="header-titles">
          <h1>Pendaftaran Order Baru</h1>
          <p>Lengkapi pendaftaran pasien, pemeriksaan klinis, pemilihan produk, dan checkout dalam satu alur.</p>
        </div>
      </div>

      {/* Stepper progress indicator */}
      <div className="wizard-stepper-full">
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <div className={`wstep ${i === step ? 'active' : i < step ? 'done' : ''}`} onClick={() => i < step && setStep(i)}>
              <div className="wstep-dot">
                {i < step ? <CheckCircle size={18} /> : i + 1}
              </div>
              <div className="wstep-info">
                <span className="wstep-label">Langkah {i + 1}</span>
                <span className="wstep-title">{label}</span>
              </div>
            </div>
            {i < STEPS.length - 1 && <div className={`wstep-line-full ${i < step ? 'done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      {pageLoading ? (
        <div className="flex items-center justify-center min-h-[350px] flex-col gap-2 bg-white rounded-xl shadow-sm p-8">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-gray-500">Menyiapkan form checkout...</p>
        </div>
      ) : (
        <div className="wizard-container-card">
          <div className="wizard-card-body">

            {/* ═══ STEP 0: DATA PASIEN ═══ */}
            {step === 0 && (
              <div className="wstep-content animate-fade-in">
                <div className="step-section-header">
                  <h2>1. Registrasi & Pemilihan Pasien</h2>
                  <p>Cari pasien yang sudah terdaftar atau buat pendaftaran baru dengan klasifikasi Umum/BPJS.</p>
                </div>

                <div className="patient-step-controls">
                  <div className="search-input-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                      className="form-control search-input"
                      placeholder="Cari nama pasien, No. HP, atau No. BPJS..."
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                    />
                  </div>
                  <button
                    className={`btn ${showNewPatient ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => setShowNewPatient(v => !v)}
                  >
                    <UserPlus size={16} /> {showNewPatient ? 'Batal' : '+ Pasien Baru'}
                  </button>
                </div>

                {/* Inline patient creation form */}
                {showNewPatient && (
                  <div className="patient-registration-card animate-fade-in">
                    <h3>Pendaftaran Pasien Baru</h3>
                    <div className="patient-form-grid">
                      
                      {/* Classification Selection */}
                      <div className="field-group full-width-field">
                        <label className="form-label font-semibold">Klasifikasi Pasien *</label>
                        <div className="classification-toggle">
                          <button
                            type="button"
                            className={`class-btn ${npType === 'umum' ? 'active-umum' : ''}`}
                            onClick={() => setNpType('umum')}
                          >
                            🟢 PASIEN UMUM
                          </button>
                          <button
                            type="button"
                            className={`class-btn ${npType === 'bpjs' ? 'active-bpjs' : ''}`}
                            onClick={() => setNpType('bpjs')}
                          >
                            🔵 PASIEN BPJS
                          </button>
                        </div>
                      </div>

                      <div className="field-group">
                        <label className="form-label">Nama Lengkap *</label>
                        <input className="form-control" placeholder="Masukkan nama lengkap" value={npName} onChange={e => setNpName(e.target.value)} />
                      </div>

                      <div className="field-group">
                        <label className="form-label">No. HP / Kontak *</label>
                        <input className="form-control" placeholder="Contoh: 08123456789" value={npPhone} onChange={e => setNpPhone(e.target.value)} />
                      </div>

                      <div className="field-group">
                        <label className="form-label">NIK (No. KTP)</label>
                        <input className="form-control" placeholder="16 digit NIK" value={npNik} onChange={e => setNpNik(e.target.value)} />
                      </div>

                      <div className="field-group">
                        <label className="form-label">Tanggal Lahir</label>
                        <input type="date" className="form-control" value={npBirthDate} onChange={e => setNpBirthDate(e.target.value)} />
                      </div>

                      <div className="field-group">
                        <label className="form-label">Jenis Kelamin</label>
                        <select className="form-control" value={npGender} onChange={e => setNpGender(e.target.value as 'male' | 'female')}>
                          <option value="male">Laki-laki</option>
                          <option value="female">Perempuan</option>
                        </select>
                      </div>

                      {npType === 'bpjs' && (
                        <div className="field-group bpjs-field-highlight animate-fade-in">
                          <label className="form-label text-primary font-bold">No. Kartu BPJS</label>
                          <input
                            className="form-control border-primary"
                            placeholder="Masukkan No. BPJS Kesehatan"
                            value={npBpjsNumber}
                            onChange={e => setNpBpjsNumber(e.target.value)}
                          />
                        </div>
                      )}

                      <div className="field-group full-width-field">
                        <label className="form-label">Alamat Lengkap</label>
                        <textarea className="form-control" rows={2} placeholder="Alamat tinggal..." value={npAddress} onChange={e => setNpAddress(e.target.value)} />
                      </div>

                    </div>
                    <div className="form-actions">
                      <button
                        className="btn btn-primary shadow-glow d-flex align-items-center gap-2"
                        onClick={saveNewPatient}
                        disabled={createPatientMutation.isPending || !npName.trim() || !npPhone.trim()}
                      >
                        {createPatientMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
                        Daftarkan & Pilih Pasien
                      </button>
                    </div>
                  </div>
                )}

                {/* Patient grid selection */}
                <div className="patient-selection-grid">
                  {filteredPatients.map(p => {
                    const isBpjs = !!p.bpjs_number;
                    return (
                      <div
                        key={p.id}
                        className={`patient-select-card ${selectedPatient?.id === p.id ? 'selected' : ''}`}
                        onClick={() => setSelectedPatient(p)}
                      >
                        <div className="patient-select-card-header">
                          <div className={`p-avatar ${isBpjs ? 'bpjs-avatar' : 'umum-avatar'}`}>
                            {p.name.charAt(0)}
                          </div>
                          <div className="p-header-details">
                            <span className="p-id-label">{p.id}</span>
                            <h3>{p.name}</h3>
                          </div>
                          {isBpjs ? (
                            <span className="classification-badge bpjs">BPJS KESEHATAN</span>
                          ) : (
                            <span className="classification-badge umum">UMUM</span>
                          )}
                        </div>

                        <div className="patient-select-card-body">
                          <div className="p-meta-item">
                            <span className="p-meta-label">No. HP:</span>
                            <span className="p-meta-val">{p.phone ?? '—'}</span>
                          </div>
                          {p.nik && (
                            <div className="p-meta-item">
                              <span className="p-meta-label">NIK:</span>
                              <span className="p-meta-val">{p.nik}</span>
                            </div>
                          )}
                          {isBpjs && (
                            <div className="p-meta-item bpjs-highlight-text">
                              <span className="p-meta-label">No. BPJS:</span>
                              <span className="p-meta-val">{p.bpjs_number}</span>
                            </div>
                          )}
                        </div>

                        {selectedPatient?.id === p.id && (
                          <div className="card-selected-tick">
                            <CheckCircle size={24} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ STEP 1: PEMERIKSAAN CLINICAL ═══ */}
            {step === 1 && (
              <div className="wstep-content animate-fade-in">
                <div className="step-section-header">
                  <h2>2. Pemeriksaan Klinis (Refraksi & Resep)</h2>
                  <p>Masukkan hasil pemeriksaan RO (Optometris internal) atau salin resep rujukan dokter luar.</p>
                </div>

                <div className="skip-exam-banner">
                  <div className="banner-content">
                    <Activity size={24} className="banner-icon" />
                    <div>
                      <h4>Lewati Pemeriksaan Klinis?</h4>
                      <p>Jika pasien hanya membeli kacamata aksesoris/frame saja tanpa resep lensa baru, Anda dapat melewati langkah ini.</p>
                    </div>
                  </div>
                  <label className="checkbox-toggle-switch">
                    <input type="checkbox" checked={skipExam} onChange={e => setSkipExam(e.target.checked)} />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">{skipExam ? 'YA, LEWATI' : 'TIDAK, INPUT DATA'}</span>
                  </label>
                </div>

                {!skipExam && (
                  <div className="exam-wizard-layout-new">
                    
                    {/* Selector / Toggle for External Prescription */}
                    <div className="rx-layout-toggle-row">
                      <label className="checkbox-toggle-switch flex-1">
                        <input
                          type="checkbox"
                          checked={hasExtRx}
                          onChange={e => {
                            setHasExtRx(e.target.checked);
                            if (!e.target.checked) setUseExtRxForOrder(false);
                          }}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label font-bold text-sm">
                          {hasExtRx ? '🔵 ADA RESEP DOKTER LUAR (RUJUKAN)' : '⚪ TIDAK ADA RESEP DOKTER LUAR (KLIK UNTUK INPUT)'}
                        </span>
                      </label>

                      {hasExtRx && (
                        <div className="prescription-selector-box animate-fade-in">
                          <span className="selector-instruction-label">Gunakan resep untuk pembuatan lensa:</span>
                          <div className="selector-options">
                            <label className="radio-label">
                              <input
                                type="radio"
                                name="useRx"
                                checked={!useExtRxForOrder}
                                onChange={() => setUseExtRxForOrder(false)}
                              />
                              🔬 Pemeriksaan Internal Optik
                            </label>
                            <label className="radio-label">
                              <input
                                type="radio"
                                name="useRx"
                                checked={useExtRxForOrder}
                                onChange={() => setUseExtRxForOrder(true)}
                              />
                              📋 Resep Dokter Luar
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dual Grid Layout */}
                    <div className={`refraction-panels-grid ${hasExtRx ? 'two-columns' : 'one-column'}`}>
                      
                      {/* Left Column: Internal Optic Refraction */}
                      <div className="refraction-panel-card internal-card-border">
                        <div className="panel-title-bar bg-secondary-light">
                          <h3>🔬 Pemeriksaan Internal Optik</h3>
                        </div>
                        <div className="panel-body-fields">
                          <div className="field-group">
                            <label className="form-label">Tanggal Pemeriksaan</label>
                            <input
                              type="date"
                              className="form-control"
                              value={rxDateInt}
                              onChange={e => setRxDateInt(e.target.value)}
                            />
                          </div>

                          <div className="refraction-table-container">
                            <div className="refraction-header-row bg-secondary text-white font-bold">
                              <span>MATA</span>
                              <span>SPH</span>
                              <span>CYL</span>
                              <span>AXIS</span>
                              <span>ADD</span>
                            </div>
                            
                            {/* OD Row */}
                            <div className="refraction-row od">
                              <div className="eye-badge od">OD <small>Kanan</small></div>
                              <input
                                type="number"
                                step="0.25"
                                className="ref-cell"
                                value={odInt.sph}
                                onChange={e => setOdInt(p => ({ ...p, sph: e.target.value }))}
                              />
                              <input
                                type="number"
                                step="0.25"
                                className="ref-cell"
                                value={odInt.cyl}
                                onChange={e => setOdInt(p => ({ ...p, cyl: e.target.value }))}
                              />
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="180"
                                className="ref-cell"
                                value={odInt.axis}
                                onChange={e => setOdInt(p => ({ ...p, axis: e.target.value }))}
                              />
                              <input
                                type="number"
                                step="0.25"
                                className="ref-cell"
                                value={odInt.add}
                                onChange={e => setOdInt(p => ({ ...p, add: e.target.value }))}
                              />
                            </div>

                            {/* OS Row */}
                            <div className="refraction-row os">
                              <div className="eye-badge os">OS <small>Kiri</small></div>
                              <input
                                type="number"
                                step="0.25"
                                className="ref-cell"
                                value={osInt.sph}
                                onChange={e => setOsInt(p => ({ ...p, sph: e.target.value }))}
                              />
                              <input
                                type="number"
                                step="0.25"
                                className="ref-cell"
                                value={osInt.cyl}
                                onChange={e => setOsInt(p => ({ ...p, cyl: e.target.value }))}
                              />
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="180"
                                className="ref-cell"
                                value={osInt.axis}
                                onChange={e => setOsInt(p => ({ ...p, axis: e.target.value }))}
                              />
                              <input
                                type="number"
                                step="0.25"
                                className="ref-cell"
                                value={osInt.add}
                                onChange={e => setOsInt(p => ({ ...p, add: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="refraction-specs-row">
                            <div className="field-group" style={{ maxWidth: '120px' }}>
                              <label className="form-label">PD (Pupil Dist.)</label>
                              <div className="input-group">
                                <input
                                  type="number"
                                  className="form-control text-center font-bold"
                                  value={pdInt}
                                  onChange={e => setPdInt(e.target.value)}
                                />
                                <span className="input-addon">mm</span>
                              </div>
                            </div>

                            <div className="field-group flex-1">
                              <label className="form-label">Tipe Lensa yang Dibutuhkan</label>
                              <select
                                className="form-control"
                                value={typeInt}
                                onChange={e => setTypeInt(e.target.value as 'monofocal' | 'bifocal' | 'progressive')}
                              >
                                <option value="monofocal">Monofocal (Single Vision Jauh/Dekat)</option>
                                <option value="bifocal">Bifocal (Double Vision Jauh & Dekat)</option>
                                <option value="progressive">Progressive (Multi-focal Tanpa Sekat)</option>
                              </select>
                            </div>
                          </div>

                          <div className="field-group">
                            <label className="form-label">Catatan Refraksi / Keluhan Pasien</label>
                            <textarea
                              className="form-control"
                              rows={3}
                              placeholder="Keluhan pandangan buram, rasa pusing, dll..."
                              value={notesInt}
                              onChange={e => setNotesInt(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Column: External Prescription (Only if toggled) */}
                      {hasExtRx && (
                        <div className="refraction-panel-card external-card-border animate-fade-in">
                          <div className="panel-title-bar bg-warning-light">
                            <h3>📋 Resep Dokter Luar (Rujukan)</h3>
                          </div>
                          <div className="panel-body-fields">
                            <div className="field-row">
                              <div className="field-group">
                                <label className="form-label">Tanggal Resep</label>
                                <input
                                  type="date"
                                  className="form-control"
                                  value={rxDateExt}
                                  onChange={e => setRxDateExt(e.target.value)}
                                />
                              </div>
                              <div className="field-group">
                                <label className="form-label">Jenis Rujukan</label>
                                <select
                                  className="form-control"
                                  value={rxExtSrc}
                                  onChange={e => setRxExtSrc(e.target.value)}
                                >
                                  <option value="bpjs">BPJS Kesehatan</option>
                                  <option value="rumah_sakit">Rumah Sakit</option>
                                  <option value="klinik">Klinik Swasta</option>
                                  <option value="dokter_praktek">Dokter Praktek Mandiri</option>
                                  <option value="lainnya">Lainnya</option>
                                </select>
                              </div>
                            </div>

                            <div className="field-row">
                              <div className="field-group">
                                <label className="form-label">Nama Dokter Pemeriksa</label>
                                <input
                                  className="form-control"
                                  placeholder="Dr. Contoh Nama, Sp.M"
                                  value={rxDr}
                                  onChange={e => setRxDr(e.target.value)}
                                />
                              </div>
                              <div className="field-group">
                                <label className="form-label">Nama Fasilitas Kesehatan</label>
                                <input
                                  className="form-control"
                                  placeholder="RSUD / Klinik / Puskesmas"
                                  value={rxFacility}
                                  onChange={e => setRxFacility(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="field-group">
                              <label className="form-label">No. Rujukan / Surat</label>
                              <input
                                className="form-control"
                                placeholder="Contoh: No. Rujukan BPJS Kesehatan"
                                value={rxRefNo}
                                onChange={e => setRxRefNo(e.target.value)}
                              />
                            </div>

                            <div className="refraction-table-container">
                              <div className="refraction-header-row bg-warning text-white font-bold">
                                <span>MATA</span>
                                <span>SPH</span>
                                <span>CYL</span>
                                <span>AXIS</span>
                                <span>ADD</span>
                              </div>
                              
                              {/* OD Row */}
                              <div className="refraction-row od">
                                <div className="eye-badge od">OD <small>Kanan</small></div>
                                <input
                                  type="number"
                                  step="0.25"
                                  className="ref-cell"
                                  value={odExt.sph}
                                  onChange={e => setOdExt(p => ({ ...p, sph: e.target.value }))}
                                />
                                <input
                                  type="number"
                                  step="0.25"
                                  className="ref-cell"
                                  value={odExt.cyl}
                                  onChange={e => setOdExt(p => ({ ...p, cyl: e.target.value }))}
                                />
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  max="180"
                                  className="ref-cell"
                                  value={odExt.axis}
                                  onChange={e => setOdExt(p => ({ ...p, axis: e.target.value }))}
                                />
                                <input
                                  type="number"
                                  step="0.25"
                                  className="ref-cell"
                                  value={odExt.add}
                                  onChange={e => setOdExt(p => ({ ...p, add: e.target.value }))}
                                />
                              </div>

                              {/* OS Row */}
                              <div className="refraction-row os">
                                <div className="eye-badge os">OS <small>Kiri</small></div>
                                <input
                                  type="number"
                                  step="0.25"
                                  className="ref-cell"
                                  value={osExt.sph}
                                  onChange={e => setOsExt(p => ({ ...p, sph: e.target.value }))}
                                />
                                <input
                                  type="number"
                                  step="0.25"
                                  className="ref-cell"
                                  value={osExt.cyl}
                                  onChange={e => setOsExt(p => ({ ...p, cyl: e.target.value }))}
                                />
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  max="180"
                                  className="ref-cell"
                                  value={osExt.axis}
                                  onChange={e => setOsExt(p => ({ ...p, axis: e.target.value }))}
                                />
                                <input
                                  type="number"
                                  step="0.25"
                                  className="ref-cell"
                                  value={osExt.add}
                                  onChange={e => setOsExt(p => ({ ...p, add: e.target.value }))}
                                />
                              </div>
                            </div>

                            <div className="refraction-specs-row">
                              <div className="field-group" style={{ maxWidth: '120px' }}>
                                <label className="form-label">PD (Pupil Dist.)</label>
                                <div className="input-group">
                                  <input
                                    type="number"
                                    className="form-control text-center font-bold"
                                    value={pdExt}
                                    onChange={e => setPdExt(e.target.value)}
                                  />
                                  <span className="input-addon">mm</span>
                                </div>
                              </div>

                              <div className="field-group flex-1">
                                <label className="form-label">Tipe Lensa yang Dibutuhkan</label>
                                <select
                                  className="form-control"
                                  value={typeExt}
                                  onChange={e => setTypeExt(e.target.value as 'monofocal' | 'bifocal' | 'progressive')}
                                >
                                  <option value="monofocal">Monofocal (Single Vision Jauh/Dekat)</option>
                                  <option value="bifocal">Bifocal (Double Vision Jauh & Dekat)</option>
                                  <option value="progressive">Progressive (Multi-focal Tanpa Sekat)</option>
                                </select>
                              </div>
                            </div>

                            <div className="field-group">
                              <label className="form-label">Catatan Resep / Petunjuk Tambahan</label>
                              <textarea
                                className="form-control"
                                rows={3}
                                placeholder="Catatan dari resep dokter luar..."
                                value={notesExt}
                                onChange={e => setNotesExt(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ STEP 2: PILIH PRODUK ═══ */}
            {step === 2 && (
              <div className="wstep-content animate-fade-in">
                <div className="step-section-header">
                  <h2>3. Pemilihan Item & Keranjang Belanja</h2>
                  <p>Pilih frame, lensa kustom, aksesoris, atau jasa pengerjaan dari inventori stok.</p>
                </div>

                <div className="products-grid-layout">
                  {/* Left side: Stock catalog */}
                  <div className="stock-catalog-pane">
                    <div className="search-box-wrap">
                      <Search size={18} className="search-icon" />
                      <input
                        className="form-control search-input"
                        placeholder="Cari frame, lensa, merk, SKU, dll..."
                        value={stockSearch}
                        onChange={e => setStockSearch(e.target.value)}
                      />
                    </div>

                    {/* Custom ad-hoc item trigger */}
                    <div className="custom-item-trigger-row mt-3">
                      <button 
                        type="button" 
                        className={`custom-item-toggle-btn ${showCustomItemForm ? 'is-open' : ''}`}
                        onClick={() => setShowCustomItemForm(!showCustomItemForm)}
                      >
                        <span className="custom-item-toggle-icon">
                          {showCustomItemForm ? '✕' : '+'}
                        </span>
                        <span className="custom-item-toggle-text">
                          {showCustomItemForm ? 'Tutup Panel Input Custom' : 'Tambah Item Custom / Lensa Gosokan'}
                        </span>
                        {!showCustomItemForm && <span className="custom-item-toggle-badge">Non-Stok</span>}
                      </button>
                    </div>

                    {showCustomItemForm && (
                      <div className="custom-item-panel animate-fade-in">
                        <div className="custom-item-panel-header">
                          <div className="custom-item-panel-icon">🔭</div>
                          <div>
                            <h4 className="custom-item-panel-title">Item Kustom / Lensa Gosokan</h4>
                            <p className="custom-item-panel-desc">Tambahkan lensa gosokan, frame khusus, atau jasa yang tidak ada di inventori stok.</p>
                          </div>
                        </div>

                        <div className="custom-item-category-tabs">
                          {([['lens', '🔭', 'Lensa Gosokan'], ['frame', '🕶', 'Frame Kustom'], ['service', '🔧', 'Jasa Khusus']] as [typeof customCategory, string, string][]).map(([val, icon, label]) => (
                            <button
                              key={val}
                              type="button"
                              className={`custom-cat-tab ${customCategory === val ? 'active' : ''} cat-tab-${val}`}
                              onClick={() => setCustomCategory(val)}
                            >
                              <span>{icon}</span>
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>

                        <div className="custom-item-fields">
                          <div className="field-group">
                            <label className="form-label">Nama Item *</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder={customCategory === 'lens' ? 'Contoh: Lensa Essilor Transitions Gen 8 — Anti Radiasi' : customCategory === 'frame' ? 'Contoh: Frame Titanium Full Rim Kode A1' : 'Contoh: Jasa Pasang + Gosok Lensa Premium'}
                              value={customName}
                              onChange={e => setCustomName(e.target.value)}
                            />
                          </div>
                          <div className="custom-item-price-row">
                            <div className="field-group" style={{ flex: 1 }}>
                              <label className="form-label">Harga Jual (Rp) *</label>
                              <div className="custom-price-input-wrap">
                                <span className="custom-price-prefix">Rp</span>
                                <input 
                                  type="number" 
                                  className="form-control" 
                                  placeholder="0" 
                                  value={customPrice || ''}
                                  onChange={e => setCustomPrice(Number(e.target.value))}
                                  style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0', borderLeft: 'none' }}
                                />
                              </div>
                            </div>
                            {customPrice > 0 && (
                              <div className="custom-price-preview">
                                <span className="custom-price-preview-label">Total</span>
                                <span className="custom-price-preview-val">{rp(customPrice)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button 
                          type="button" 
                          className="custom-item-submit-btn" 
                          disabled={!customName.trim() || customPrice <= 0}
                          onClick={() => {
                            addCustomItem(customName.trim(), customCategory, customPrice);
                            setCustomName('');
                            setCustomPrice(0);
                            setShowCustomItemForm(false);
                          }}
                        >
                          <Plus size={16} />
                          Masukkan ke Keranjang
                        </button>
                      </div>
                    )}

                    <div className="catalog-scroll-area">
                      {['frame', 'lens', 'service'].map(cat => {
                        const list = filteredStock.filter(s => s.category === cat);
                        if (!list.length) return null;
                        return (
                          <div key={cat} className="catalog-category-section">
                            <h4 className="catalog-cat-title">
                              {cat === 'frame' ? '🕶 KOLEKSI FRAME KACAMATA' : cat === 'lens' ? '🔭 JENIS LENSA REFRAKSI' : '🔧 JASA & BIAYA TAMBAHAN'}
                            </h4>
                            <div className="catalog-items-grid">
                              {list.map(s => {
                                const isLowStock = s.stock <= s.min_stock;
                                return (
                                  <div key={s.id} className="catalog-item-card" onClick={() => addItem(s)}>
                                    <div className="item-card-details">
                                      <span className={`cat-tag tag-${s.category}`}>{s.category.toUpperCase()}</span>
                                      <h3>{s.brand} {s.name}</h3>
                                      {s.color && <span className="color-label">Warna: {s.color}</span>}
                                      {s.sku && <span className="sku-label">SKU: {s.sku}</span>}
                                    </div>
                                    <div className="item-card-action">
                                      <span className="price-tag">{rp(s.sell_price)}</span>
                                      <span className={`stock-badge ${isLowStock ? 'low' : ''}`}>
                                        Stok: {s.stock === 999 ? '∞' : s.stock}
                                      </span>
                                      <button type="button" className="btn-add-cart">
                                        <Plus size={16} /> Tambah
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right side: Shopping Cart */}
                  <div className="shopping-cart-pane">
                    <h3>Keranjang Belanja ({items.length} item)</h3>
                    
                    {items.length === 0 ? (
                      <div className="empty-cart-state">
                        <AlertCircle size={40} />
                        <p>Keranjang kosong. Pilih produk atau jasa dari katalog di sebelah kiri.</p>
                      </div>
                    ) : (
                      <div className="cart-items-list">
                        {items.map(item => (
                          <div key={item.id} className="cart-item-row-new">
                            <div className="cart-item-desc">
                              <span className={`dot dot-${item.product_type}`} />
                              <div>
                                <h4>{item.name}</h4>
                                <span className="type-label">{item.product_type}</span>
                              </div>
                            </div>

                            <div className="cart-item-actions-grid">
                              <div className="qty-picker">
                                <button
                                  type="button"
                                  onClick={() => setItems(prev => prev.map(i => i.id === item.id ? { ...i, qty: Math.max(1, i.qty - 1), subtotal: Math.max(1, i.qty - 1) * i.sell_price } : i))}
                                >
                                  -
                                </button>
                                <span>{item.qty}</span>
                                <button
                                  type="button"
                                  onClick={() => setItems(prev => prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.sell_price } : i))}
                                >
                                  +
                                </button>
                              </div>

                              <div className="cart-price-input-wrap">
                                <span className="currency-lbl">Rp</span>
                                <input
                                  type="number"
                                  className="price-cell-input"
                                  value={item.sell_price}
                                  onChange={e => setItems(prev => prev.map(i => i.id === item.id ? { ...i, sell_price: Number(e.target.value), subtotal: Number(e.target.value) * i.qty } : i))}
                                />
                              </div>

                              <span className="cart-subtotal-val">{rp(item.subtotal)}</span>

                              <button
                                type="button"
                                className="btn-remove-item"
                                onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="cart-totals-section">
                      <div className="field-group">
                        <label className="form-label">Potongan Diskon Global (Rp)</label>
                        <input
                          type="number"
                          className="form-control font-bold text-danger"
                          value={discount}
                          onChange={e => setDiscount(Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>

                      <div className="totals-summary-box">
                        <div className="summary-row-new">
                          <span>Subtotal Item</span>
                          <span>{rp(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="summary-row-new text-danger">
                            <span>Diskon Global</span>
                            <span>- {rp(discount)}</span>
                          </div>
                        )}
                        <div className="summary-row-new grand-total-row">
                          <span>TOTAL AKHIR</span>
                          <span>{rp(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 3: PEMBAYARAN & CHECKOUT ═══ */}
            {step === 3 && (
              <div className="wstep-content animate-fade-in">
                <div className="step-section-header">
                  <h2>4. Pembayaran & Konfirmasi Checkout</h2>
                  <p>Pilih metode bayar, masukkan nominal, dan konfirmasi transaksi.</p>
                </div>

                <div className="pos-checkout-layout">

                  {/* ── LEFT: Order Summary ── */}
                  <div className="pos-order-summary">
                    <div className="pos-summary-header">
                      <span>🧾 Ringkasan Pesanan</span>
                      <span className="pos-item-count">{items.length} item</span>
                    </div>

                    <div className="pos-patient-bar">
                      <div className="pos-patient-avatar">
                        {selectedPatient?.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <div className="pos-patient-name">{selectedPatient?.name}</div>
                        <div className="pos-patient-type">
                          {selectedPatient?.bpjs_number ? `BPJS — ${selectedPatient.bpjs_number}` : 'Pasien Umum'}
                        </div>
                      </div>
                    </div>

                    <div className="pos-items-list">
                      {items.map(item => (
                        <div key={item.id} className="pos-item-row">
                          <div className="pos-item-info">
                            <span className={`pos-item-dot dot-${item.product_type}`} />
                            <div>
                              <div className="pos-item-name">{item.name}</div>
                              <div className="pos-item-meta">{item.qty}x × {rp(item.sell_price)}</div>
                            </div>
                          </div>
                          <div className="pos-item-sub">{rp(item.subtotal)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="pos-totals-box">
                      <div className="pos-total-row">
                        <span>Subtotal</span>
                        <span>{rp(subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="pos-total-row pos-discount-row">
                          <span>Diskon</span>
                          <span>− {rp(discount)}</span>
                        </div>
                      )}
                      <div className="pos-grand-total-row">
                        <span>TOTAL TAGIHAN</span>
                        <span>{rp(total)}</span>
                      </div>
                    </div>

                    <div className="field-group" style={{padding: '0 0.25rem'}}>
                      <label className="form-label">Catatan Pesanan</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Contoh: Frame adjust, lensa anti-radiasi abu-abu..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* ── RIGHT: POS Payment Terminal ── */}
                  <div className="pos-payment-terminal">

                    {/* Method Selection */}
                    <div className="pos-section-label">Metode Pembayaran</div>
                    <div className="pos-method-grid">
                      {([
                        { v: 'tunai',    icon: '💵', l: 'Tunai',    desc: 'Cash / Uang Fisik',  color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
                        { v: 'qris',     icon: '📱', l: 'QRIS',     desc: 'Scan QR Code',       color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
                        { v: 'transfer', icon: '🏦', l: 'Transfer', desc: 'Transfer Bank',      color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
                      ] as {v: PaymentMethod; icon: string; l: string; desc: string; color: string; bg: string; border: string}[]).map(m => (
                        <button
                          key={m.v}
                          type="button"
                          className={`pos-method-btn ${payMethod === m.v ? 'active' : ''}`}
                          style={payMethod === m.v ? { borderColor: m.border, background: m.bg, color: m.color, boxShadow: `0 0 0 3px ${m.border}50` } : {}}
                          onClick={() => { setPayMethod(m.v); if (m.v !== 'tunai') setPayAmount(total - discount); }}
                        >
                          <span className="pay-method-icon">{m.icon}</span>
                          <span className="pay-method-name">{m.l}</span>
                          <span className="pay-method-desc">{m.desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Discount Input in Payment Step */}
                    <div className="pos-discount-section">
                      <div className="pos-section-label">Diskon Transaksi</div>
                      <div className="pos-discount-input-row">
                        <div className="pos-discount-input-wrap">
                          <span className="pos-discount-prefix">Rp</span>
                          <input
                            type="number"
                            className="pos-discount-input"
                            value={discount || ''}
                            onChange={e => setDiscount(Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                        {subtotal > 0 && (
                          <div className="pos-discount-presets">
                            {[5, 10, 15, 20].map(pct => (
                              <button
                                key={pct}
                                type="button"
                                className={`pos-discount-preset-btn ${Math.round((discount / subtotal) * 100) === pct ? 'active' : ''}`}
                                onClick={() => setDiscount(Math.round(subtotal * pct / 100))}
                              >
                                {pct}%
                              </button>
                            ))}
                            <button
                              type="button"
                              className="pos-discount-preset-btn reset"
                              onClick={() => setDiscount(0)}
                            >
                              Reset
                            </button>
                          </div>
                        )}
                      </div>
                      {discount > 0 && (
                        <div className="pos-discount-summary">
                          <span>Potongan aktif:</span>
                          <strong className="pos-discount-amount">− {rp(discount)}</strong>
                          <span className="pos-discount-pct">({subtotal > 0 ? Math.round((discount / subtotal) * 100) : 0}%)</span>
                        </div>
                      )}
                    </div>

                    {/* Amount Display */}
                    <div className="pos-amount-display">
                      <div className="pos-amount-label">Uang Diterima (Rp)</div>
                      <div className="pos-amount-input-wrap">
                        <span className="pos-amount-prefix">Rp</span>
                        <input
                          type="number"
                          className="pos-amount-input"
                          value={payAmount || ''}
                          onChange={e => setPayAmount(Number(e.target.value))}
                          placeholder="0"
                        />
                        {payAmount > 0 && (
                          <button className="pos-clear-btn" onClick={() => setPayAmount(0)}>✕</button>
                        )}
                      </div>
                    </div>

                    {/* Quick Amount Shortcuts */}
                    {payMethod === 'tunai' && (
                      <div className="pos-exact-row-single">
                        <button
                          type="button"
                          className="pos-single-exact-btn"
                          onClick={() => setPayAmount(total)}
                        >
                          💵 Gunakan Uang Pas ({rp(total)})
                        </button>
                      </div>
                    )}

                    {/* Calculation Result */}
                    <div className={`pos-calc-result ${diff < 0 ? 'kembalian' : diff === 0 ? 'pas' : 'kurang'}`}>
                      <div className="pos-calc-row">
                        <span>Total Tagihan</span>
                        <span className="pos-calc-total">{rp(total)}</span>
                      </div>
                      <div className="pos-calc-row">
                        <span>Uang Diterima</span>
                        <span>{rp(payAmount)}</span>
                      </div>
                      <div className="pos-calc-divider" />
                      <div className="pos-calc-row pos-calc-highlight">
                        {diff < 0 ? (
                          <>
                            <span>💚 Kembalian</span>
                            <strong className="pos-kembalian">{rp(Math.abs(diff))}</strong>
                          </>
                        ) : diff === 0 ? (
                          <>
                            <span>✅ Uang Pas</span>
                            <strong className="pos-pas">Rp 0</strong>
                          </>
                        ) : (
                          <>
                            <span>🔴 Sisa (DP)</span>
                            <strong className="pos-sisa">{rp(diff)}</strong>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Wizard Footer Navigation */}
          <div className="wizard-card-footer">
            {step > 0 && (
              <button className="btn btn-secondary btn-nav" onClick={() => setStep(s => s - 1)}>
                ← Kembali ke Langkah {step}
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < STEPS.length - 1 ? (
              <button
                className="btn btn-primary btn-nav"
                disabled={!canNext[step]}
                onClick={() => setStep(s => s + 1)}
              >
                Lanjut ke: {STEPS[step + 1]} <ChevronRight size={18} />
              </button>
            ) : (
              <button
                className="btn btn-success btn-checkout shadow-glow d-flex align-items-center gap-2"
                onClick={handleSave}
                disabled={checkoutMutation.isPending || !selectedPatient}
              >
                {checkoutMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Simpan & Selesaikan Transaksi
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewOrderPage;
