import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Search, ShieldCheck, Trash2, DollarSign, CreditCard, ChevronRight, Loader2
} from 'lucide-react';
import { patientsService, examinationsService, stockService, transactionsService } from '../services/api';
import { UserPlus, User, X, Eye, FileText } from 'lucide-react';

const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface CartItem {
  id: string;
  product_type: 'frame' | 'lens' | 'service' | 'accessory';
  product_id?: string;
  name: string;
  original_price: number;
  sell_price: number;
  qty: number;
  subtotal: number;
}

export default function NewOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initPatientId = searchParams.get('patientId') || '';

  const [step, setStep] = useState(1);

  // ── STEP 1: Data Pasien ──
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [npName, setNpName] = useState('');
  const [npPhone, setNpPhone] = useState('');
  const [npGender, setNpGender] = useState<'male'|'female'>('male');
  const [npNik, setNpNik] = useState('');
  const [npBirthDate, setNpBirthDate] = useState('');
  const [npAddress, setNpAddress] = useState('');
  const [npType, setNpType] = useState<'umum'|'bpjs'>('umum');
  const [npBpjsNumber, setNpBpjsNumber] = useState('');

  // ── STEP 2: Pemeriksaan Klinis ──
  const [skipExam, setSkipExam] = useState(false);
  const [rxSource, setRxSource] = useState<'internal' | 'external'>('internal');
  const [selectedInternalExam, setSelectedInternalExam] = useState<any>(null);
  // Internal Exam Input (when no history)
  const [rxDateInt, setRxDateInt] = useState(new Date().toISOString().split('T')[0]);
  const [typeInt, setTypeInt] = useState<'monofocal'|'bifocal'|'progressive'>('monofocal');
  const [pdInt, setPdInt] = useState('64');
  const [notesInt, setNotesInt] = useState('');
  const [odInt, setOdInt] = useState({ sph: '0', cyl: '0', axis: '0', add: '0' });
  const [osInt, setOsInt] = useState({ sph: '0', cyl: '0', axis: '0', add: '0' });

  // External prescription fields
  const [rxDr, setRxDr] = useState('');
  const [rxFacility, setRxFacility] = useState('');
  const [rxRefNo, setRxRefNo] = useState('');
  const [rxExtType, setRxExtType] = useState<'monofocal' | 'bifocal' | 'progressive'>('monofocal');
  const [rxNotes, setRxNotes] = useState('');

  // External OD / OS Rx values
  const [odSph, setOdSph] = useState('0.00');
  const [odCyl, setOdCyl] = useState('0.00');
  const [odAxis, setOdAxis] = useState('0');
  const [odAdd, setOdAdd] = useState('0.00');
  const [odPd, setOdPd] = useState('0.0');

  const [osSph, setOsSph] = useState('0.00');
  const [osCyl, setOsCyl] = useState('0.00');
  const [osAxis, setOsAxis] = useState('0');
  const [osAdd, setOsAdd] = useState('0.00');
  const [osPd, setOsPd] = useState('0.0');

  // ── STEP 3: Pilih Produk ──
  const [stockSearch, setStockSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<'frame' | 'lens' | 'service'>('lens');
  const [customPrice, setCustomPrice] = useState('');

  // ── STEP 4: Pembayaran & Checkout ──
  const [discount, setDiscount] = useState(0);
  const [payAmount, setPayAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'debit' | 'credit' | 'bpjs'>('cash');
  const [orderNotes, setOrderNotes] = useState('');

  // Queries
  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ['patients'],
    queryFn: patientsService.getAll,
  });

  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ['examinations'],
    queryFn: examinationsService.getAll,
  });

  const { data: stockItems = [] } = useQuery<any[]>({
    queryKey: ['stock'],
    queryFn: stockService.getAll,
  });

  // Automatically select patient if ID is provided in query params
  useEffect(() => {
    if (initPatientId && patients.length > 0) {
      const found = patients.find(p => p.id === initPatientId);
      if (found) setSelectedPatient(found);
    }
  }, [initPatientId, patients]);

  // Filter internal exams for the selected patient
  const patientExams = useMemo(() => {
    if (!selectedPatient) return [];
    return exams.filter(ex => ex.patient_id === selectedPatient.id && ex.source === 'internal');
  }, [selectedPatient, exams]);

  // Create Patient Mutation
  const createPatientMutation = useMutation({
    mutationFn: (data: any) => patientsService.create(data),
    onSuccess: (newP: any) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setSelectedPatient(newP);
      setShowNewPatient(false);
      setNpName(''); setNpPhone(''); setNpNik(''); setNpBirthDate(''); setNpAddress(''); setNpBpjsNumber('');
      setStep(2); // Auto proceed to clinical examination step
    },
  });

  const saveNewPatient = () => {
    if (!npName.trim() || !npPhone.trim()) return;
    createPatientMutation.mutate({
      name: npName.trim(), phone: npPhone.trim(),
      gender: npGender,
      nik: npNik.trim() ? npNik.trim() : undefined,
      birth_date: npBirthDate.trim() ? npBirthDate.trim() : undefined,
      address: npAddress.trim() ? npAddress.trim() : undefined,
      bpjs_number: npType === 'bpjs' && npBpjsNumber.trim() ? npBpjsNumber.trim() : undefined,
    });
  };

  // Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: async (payload: any) => {
      let linkedRxId: string | undefined;
      if (!payload._skipExam && payload._rxSource === 'internal' && !payload._selectedExamId && payload._newExam) {
        const res = await examinationsService.create(payload._newExam);
        linkedRxId = res.prescription?.id;
      } else if (!payload._skipExam && payload._rxSource === 'internal' && payload._selectedExamId) {
        // use existing exam - we need its prescription
        linkedRxId = selectedInternalExam?.prescription?.id;
      }
      const { _skipExam, _rxSource, _selectedExamId, _newExam, ...trxData } = payload;
      return transactionsService.create({ ...trxData, prescription_id: linkedRxId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['cashbook'] });
      queryClient.invalidateQueries({ queryKey: ['examinations'] });
      navigate('/transaksi');
    },
  });

  // Cart helper calculations
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);
  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);
  const sisa = useMemo(() => Math.max(0, total - payAmount), [total, payAmount]);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.phone && p.phone.includes(patientSearch))
  );

  const filteredStock = stockItems.filter(item =>
    item.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
    item.sku.toLowerCase().includes(stockSearch.toLowerCase())
  );

  // Cart operations
  const addToCart = (item: any) => {
    const existing = cart.find(c => c.product_id === item.id);
    if (existing) {
      setCart(cart.map(c => c.product_id === item.id ? { ...c, qty: c.qty + 1, subtotal: (c.qty + 1) * c.sell_price } : c));
    } else {
      setCart([...cart, {
        id: `stock_${item.id}`,
        product_type: item.category,
        product_id: item.id,
        name: item.name,
        original_price: item.modal_price || item.original_price || 0,
        sell_price: item.sell_price,
        qty: 1,
        subtotal: item.sell_price,
      }]);
    }
  };

  const addCustomItem = () => {
    if (!customName.trim() || !customPrice) return;
    const price = parseFloat(customPrice) || 0;
    setCart([...cart, {
      id: `custom_${Date.now()}`,
      product_type: customCategory,
      name: customName.trim(),
      original_price: price,
      sell_price: price,
      qty: 1,
      subtotal: price,
    }]);
    setCustomName('');
    setCustomPrice('');
    setShowCustomForm(false);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const nextQty = Math.max(1, c.qty + delta);
        return { ...c, qty: nextQty, subtotal: nextQty * c.sell_price };
      }
      return c;
    }));
  };

  const handleCheckout = () => {
    if (!selectedPatient || cart.length === 0) return;
    const noHistory = patientExams.length === 0;
    let newExamPayload: any = undefined;
    if (!skipExam && rxSource === 'internal' && noHistory) {
      newExamPayload = {
        exam: { patient_id: selectedPatient.id, source: 'internal' as const, exam_date: rxDateInt, notes: notesInt || undefined },
        prescription: {
          type: typeInt, pd: Number(pdInt),
          details: [
            { eye: 'R' as const, sph: Number(odInt.sph), cyl: Number(odInt.cyl)||undefined, axis: Number(odInt.axis)||undefined, add_power: Number(odInt.add)||undefined },
            { eye: 'L' as const, sph: Number(osInt.sph), cyl: Number(osInt.cyl)||undefined, axis: Number(osInt.axis)||undefined, add_power: Number(osInt.add)||undefined },
          ]
        }
      };
    }
    let extExamPayload: any = undefined;
    if (!skipExam && rxSource === 'external') {
      extExamPayload = {
        exam: { patient_id: selectedPatient.id, source: 'external' as const, external_source_type: rxExtType, doctor_name: rxDr||undefined, facility_name: rxFacility||undefined, reference_number: rxRefNo||undefined, notes: rxNotes||undefined,
          prescription_details: { od: { sph: parseFloat(odSph), cyl: parseFloat(odCyl), axis: parseInt(odAxis)||0, add: parseFloat(odAdd), pd: parseFloat(odPd) }, os: { sph: parseFloat(osSph), cyl: parseFloat(osCyl), axis: parseInt(osAxis)||0, add: parseFloat(osAdd), pd: parseFloat(osPd) } } },
      };
    }
    const methodMapping: Record<string, string> = {
      cash: 'tunai',
      transfer: 'transfer',
      debit: 'debit',
      credit: 'kredit',
      bpjs: 'bpjs',
    };
    const mappedPaymentMethod = methodMapping[paymentMethod] || 'tunai';
    checkoutMutation.mutate({
      _skipExam: skipExam, _rxSource: rxSource,
      _selectedExamId: selectedInternalExam?.id,
      _newExam: newExamPayload || extExamPayload,
      patient_id: selectedPatient.id,
      items: cart.map(c => ({ product_type: c.product_type, product_id: c.product_id||null, name: c.name, original_price: c.original_price, sell_price: c.sell_price, qty: c.qty, subtotal: c.subtotal })),
      discount, total_amount: total, paid_amount: payAmount,
      payment_method: mappedPaymentMethod, notes: orderNotes.trim()||undefined,
    });
  };

  return (
    <div className="page-scroll animate-fade-in" style={{ paddingBottom: '7rem' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <button
          style={{ border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else navigate('/');
          }}
        >
          <ArrowLeft size={20} className="text-primary" />
        </button>
        <span className="top-bar-title">Checkout Order Baru</span>
        <div style={{ width: 20 }} />
      </div>

      {/* 4-Step Progress Indicator Bar */}
      <div className="step-bar">
        <div className={`step-dot ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>1</div>
        <div className={`step-line ${step > 1 ? 'done' : ''}`} />
        <div className={`step-dot ${step >= 2 ? (step > 2 ? 'done' : 'active') : ''}`}>2</div>
        <div className={`step-line ${step > 2 ? 'done' : ''}`} />
        <div className={`step-dot ${step >= 3 ? (step > 3 ? 'done' : 'active') : ''}`}>3</div>
        <div className={`step-line ${step > 3 ? 'done' : ''}`} />
        <div className={`step-dot ${step >= 4 ? 'active' : ''}`}>4</div>
      </div>

      {/* STEP 1: PILIH DATA PASIEN */}
      {step === 1 && (
        <div style={{ padding: '1rem' }} className="animate-fade-in">
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0 }}>1. Pilih / Daftarkan Pasien</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Pilih dari daftar atau daftarkan pasien baru</p>
            </div>
            <button
              className={`btn btn-sm ripple`}
              style={{ background: showNewPatient ? '#fee2e2' : 'var(--primary-light)', color: showNewPatient ? 'var(--danger)' : 'var(--primary)', borderRadius: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px', border: 'none', fontWeight: 700, fontSize: '0.75rem' }}
              onClick={() => setShowNewPatient(!showNewPatient)}
            >
              {showNewPatient ? <X size={14} /> : <UserPlus size={14} />}
              {showNewPatient ? 'Batal' : 'Pasien Baru'}
            </button>
          </div>

          {/* Inline New Patient Form */}
          {showNewPatient && (
            <div className="card animate-fade-in" style={{ marginBottom: '1.25rem', border: '2px solid var(--primary)', background: 'linear-gradient(135deg,rgba(43,53,232,0.04) 0%,rgba(255,255,255,1) 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>Daftarkan Pasien Baru</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Isi data & klasifikasi pasien</div>
                </div>
              </div>

              {/* Klasifikasi Toggle */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                {(['umum', 'bpjs'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNpType(t)}
                    style={{ flex: 1, padding: '10px 0', borderRadius: '12px', border: `2px solid ${npType === t ? (t === 'bpjs' ? '#06b6d4' : 'var(--primary)') : 'var(--border)'}`, background: npType === t ? (t === 'bpjs' ? '#ecfeff' : 'var(--primary-light)') : 'transparent', color: npType === t ? (t === 'bpjs' ? '#0891b2' : 'var(--primary)') : 'var(--text-secondary)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    {t === 'bpjs' ? '🏥 BPJS Kesehatan' : '👤 Umum'}
                  </button>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Nama Lengkap *</label>
                <input className="form-control" placeholder="Nama pasien" value={npName} onChange={e => setNpName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group">
                  <label className="form-label">No. HP *</label>
                  <input className="form-control" type="tel" placeholder="08xx" value={npPhone} onChange={e => setNpPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Jenis Kelamin</label>
                  <select className="form-control" value={npGender} onChange={e => setNpGender(e.target.value as any)}>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group">
                  <label className="form-label">NIK</label>
                  <input className="form-control" placeholder="16 digit NIK" value={npNik} onChange={e => setNpNik(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tgl Lahir</label>
                  <input className="form-control" type="date" value={npBirthDate} onChange={e => setNpBirthDate(e.target.value)} />
                </div>
              </div>
              {npType === 'bpjs' && (
                <div className="form-group animate-fade-in">
                  <label className="form-label" style={{ color: '#0891b2', fontWeight: 700 }}>No. Kartu BPJS *</label>
                  <input className="form-control" style={{ borderColor: '#06b6d4' }} placeholder="No. BPJS 13 digit" value={npBpjsNumber} onChange={e => setNpBpjsNumber(e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Alamat</label>
                <input className="form-control" placeholder="Alamat lengkap" value={npAddress} onChange={e => setNpAddress(e.target.value)} />
              </div>
              <button
                className="btn btn-primary btn-full ripple"
                style={{ marginTop: '0.5rem', height: '44px' }}
                disabled={!npName.trim() || !npPhone.trim() || (npType === 'bpjs' && !npBpjsNumber.trim()) || createPatientMutation.isPending}
                onClick={saveNewPatient}
              >
                {createPatientMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><UserPlus size={16} /> Daftarkan & Pilih Pasien</>}
              </button>
            </div>
          )}

          {/* Patient Selected Banner */}
          {selectedPatient && (
            <div className="card animate-fade-in" style={{ marginBottom: '1rem', border: '2px solid var(--primary)', background: 'linear-gradient(135deg,var(--primary-light) 0%,white 100%)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: selectedPatient.bpjs_number ? '#06b6d4' : 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, flexShrink: 0 }}>
                    {selectedPatient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>{selectedPatient.name}</span>
                      <span className={`badge ${selectedPatient.bpjs_number ? 'badge-cyan' : 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>
                        {selectedPatient.bpjs_number ? 'BPJS' : 'UMUM'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>📱 {selectedPatient.phone || '—'}</div>
                    {selectedPatient.bpjs_number && <div style={{ fontSize: '0.7rem', color: '#0891b2', fontWeight: 600, marginTop: '2px' }}>💳 {selectedPatient.bpjs_number}</div>}
                  </div>
                </div>
                <button style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer' }}
                  onClick={() => { setSelectedPatient(null); setSelectedInternalExam(null); }}>
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Patient Search List */}
          {!selectedPatient && !showNewPatient && (
            <>
              <div className="search-bar" style={{ margin: '0 0 1rem 0' }}>
                <Search size={18} className="text-secondary" />
                <input type="text" placeholder="Cari nama, HP, No. BPJS..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {filteredPatients.map(p => {
                  const isBpjs = !!p.bpjs_number;
                  const pExams = exams.filter((ex: any) => ex.patient_id === p.id);
                  return (
                    <div key={p.id} className="list-item ripple" style={{ alignItems: 'flex-start', gap: '10px' }}
                      onClick={() => {
                        setSelectedPatient(p);
                        const patExams = exams.filter((ex: any) => ex.patient_id === p.id && ex.source === 'internal');
                        if (patExams.length > 0) {
                          patExams.sort((a: any, b: any) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
                          setSelectedInternalExam(patExams[0]);
                        }
                      }}
                    >
                      <div className="list-item-avatar" style={{ background: isBpjs ? '#06b6d4' : 'var(--primary)', flexShrink: 0 }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="list-item-content" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="list-item-title">{p.name}</div>
                          <span className={`badge ${isBpjs ? 'badge-cyan' : 'badge-gray'}`} style={{ fontSize: '0.62rem' }}>{isBpjs ? 'BPJS' : 'UMUM'}</span>
                        </div>
                        <div className="list-item-sub">📱 {p.phone || '—'}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          🔬 {pExams.length} periksa &nbsp;•&nbsp; {isBpjs ? `💳 ${p.bpjs_number}` : '👤 Pasien Umum'}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredPatients.length === 0 && (
                  <div className="card text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
                    <User size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ fontSize: '0.8rem' }}>Pasien tidak ditemukan.</p>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '8px' }} onClick={() => setShowNewPatient(true)}>
                      <UserPlus size={14} /> Daftarkan Pasien Baru
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {selectedPatient && (
            <button className="btn btn-primary btn-full ripple" style={{ marginTop: '1.5rem', height: '48px' }} onClick={() => setStep(2)}>
              Lanjutkan Ke Rekam Klinis <ChevronRight size={18} />
            </button>
          )}
        </div>
      )}

      {/* STEP 2: PEMERIKSAAN KLINIS */}
      {step === 2 && (
        <div style={{ padding: '1rem' }} className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800 }}>2. Rekam Refraksi Klinis</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="checkbox"
                id="skip"
                checked={skipExam}
                onChange={e => setSkipExam(e.target.checked)}
              />
              <label htmlFor="skip" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Lewati / Beli Saja</label>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Pilih data pemeriksaan internal terdaftar, atau masukkan detail resep luar.</p>

          {!skipExam ? (
            <>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Sumber Resep Refraksi</label>
                <div className="flex" style={{ background: 'var(--bg)', borderRadius: '12px', padding: '4px', gap: '4px' }}>
                  <button
                    type="button"
                    className="flex-1 btn btn-sm"
                    style={{
                      borderRadius: '8px',
                      background: rxSource === 'internal' ? 'var(--surface)' : 'transparent',
                      color: rxSource === 'internal' ? 'var(--primary)' : 'var(--text-secondary)',
                      boxShadow: rxSource === 'internal' ? 'var(--shadow-sm)' : 'none',
                    }}
                    onClick={() => setRxSource('internal')}
                  >
                    Optik Internal
                  </button>
                  <button
                    type="button"
                    className="flex-1 btn btn-sm"
                    style={{
                      borderRadius: '8px',
                      background: rxSource === 'external' ? 'var(--surface)' : 'transparent',
                      color: rxSource === 'external' ? 'var(--primary)' : 'var(--text-secondary)',
                      boxShadow: rxSource === 'external' ? 'var(--shadow-sm)' : 'none',
                    }}
                    onClick={() => setRxSource('external')}
                  >
                    Resep Luar
                  </button>
                </div>
              </div>

              {rxSource === 'internal' && patientExams.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Pilih riwayat pemeriksaan internal yang akan digunakan:</p>
                  {patientExams.map((ex: any) => {
                    const isSelected = selectedInternalExam?.id === ex.id;
                    const rxData = ex.prescription?.details || ex.prescription_details;
                    const od = rxData?.find?.((d: any) => d.eye === 'R') || rxData?.od || {};
                    const os = rxData?.find?.((d: any) => d.eye === 'L') || rxData?.os || {};
                    return (
                      <div key={ex.id} className="card ripple"
                        style={{ border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)', background: isSelected ? 'var(--primary-light)' : 'var(--surface)', cursor: 'pointer' }}
                        onClick={() => setSelectedInternalExam(ex)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>📅 {new Date(ex.exam_date).toLocaleDateString('id-ID')}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>Internal</span>
                            {isSelected && <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>✓ Terpilih</span>}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: 'rgba(43,53,232,0.05)', borderRadius: '8px', padding: '8px', fontSize: '0.72rem', fontFamily: 'monospace' }}>
                          <div><strong style={{ color: 'var(--primary)' }}>OD</strong> S:{od.sph ?? 0} C:{od.cyl ?? 0} A:{od.axis ?? 0}°</div>
                          <div><strong style={{ color: '#7c3aed' }}>OS</strong> S:{os.sph ?? 0} C:{os.cyl ?? 0} A:{os.axis ?? 0}°</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {rxSource === 'internal' && patientExams.length === 0 && (
                <div className="card animate-fade-in" style={{ border: '2px solid var(--primary)', background: 'linear-gradient(135deg,rgba(43,53,232,0.04) 0%,white 100%)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', padding: '8px 12px', background: 'var(--primary)', borderRadius: '10px' }}>
                    <Eye size={16} color="white" />
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'white' }}>Input Pemeriksaan Internal Baru</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)' }}>Pasien belum memiliki riwayat</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tanggal Pemeriksaan</label>
                    <input type="date" className="form-control" value={rxDateInt} onChange={e => setRxDateInt(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipe Lensa Kebutuhan</label>
                    <select className="form-control" value={typeInt} onChange={e => setTypeInt(e.target.value as any)}>
                      <option value="monofocal">Monofocal (Single Vision)</option>
                      <option value="bifocal">Bifocal</option>
                      <option value="progressive">Progressive (Multifocal)</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0' }}>
                    {/* OD Header */}
                    <div style={{ padding: '6px 10px', background: 'var(--primary)', borderRadius: '8px 8px 0 0', color: 'white', fontWeight: 800, fontSize: '0.75rem' }}>👁 MATA KANAN (OD)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '8px', background: 'rgba(43,53,232,0.05)', borderRadius: '0 0 8px 8px', marginBottom: '8px' }}>
                      {[['SPH','sph'],['CYL','cyl'],['AXIS','axis'],['ADD','add']].map(([lbl, key]) => (
                        <div key={key} className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.65rem' }}>{lbl}</label>
                          <input type="number" step="0.25" className="form-control" style={{ padding: '6px', textAlign: 'center', fontSize: '0.8rem' }}
                            value={(odInt as any)[key]} onChange={e => setOdInt(p => ({ ...p, [key]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                    {/* OS Header */}
                    <div style={{ padding: '6px 10px', background: '#7c3aed', borderRadius: '8px 8px 0 0', color: 'white', fontWeight: 800, fontSize: '0.75rem' }}>👁 MATA KIRI (OS)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '8px', background: 'rgba(124,58,237,0.05)', borderRadius: '0 0 8px 8px', marginBottom: '8px' }}>
                      {[['SPH','sph'],['CYL','cyl'],['AXIS','axis'],['ADD','add']].map(([lbl, key]) => (
                        <div key={key} className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.65rem' }}>{lbl}</label>
                          <input type="number" step="0.25" className="form-control" style={{ padding: '6px', textAlign: 'center', fontSize: '0.8rem' }}
                            value={(osInt as any)[key]} onChange={e => setOsInt(p => ({ ...p, [key]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <label className="form-label">PD (mm)</label>
                      <input type="number" className="form-control" style={{ textAlign: 'center' }} value={pdInt} onChange={e => setPdInt(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Catatan</label>
                      <input type="text" className="form-control" placeholder="Keluhan pasien..." value={notesInt} onChange={e => setNotesInt(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {rxSource === 'external' && (
                <div className="card animate-fade-in" style={{ border: '2px solid #10b981', background: 'linear-gradient(135deg,rgba(16,185,129,0.04) 0%,white 100%)' }}>
                  {/* Card Header Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', padding: '8px 12px', background: '#10b981', borderRadius: '10px' }}>
                    <FileText size={16} color="white" />
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'white' }}>Input Resep Rujukan Luar Baru</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)' }}>Rujukan Eksternal</span>
                  </div>

                  {/* Doctor & Facility details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <label className="form-label">Nama Dokter / Rujukan *</label>
                      <input type="text" className="form-control" placeholder="Contoh: Dr. Anna / Sp.M" value={rxDr} onChange={e => setRxDr(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fasilitas Kesehatan *</label>
                      <input type="text" className="form-control" placeholder="Contoh: RS Bhayangkara" value={rxFacility} onChange={e => setRxFacility(e.target.value)} required />
                    </div>
                  </div>

                  {/* Lens Type & Ref No details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <label className="form-label">Tipe Lensa Kebutuhan *</label>
                      <select className="form-control" value={rxExtType} onChange={e => setRxExtType(e.target.value as any)}>
                        <option value="monofocal">Monofocal (Single Vision)</option>
                        <option value="bifocal">Bifocal (Double Vision)</option>
                        <option value="progressive">Progressive (Multifocal)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">No. Referensi / Resep</label>
                      <input type="text" className="form-control" placeholder="Contoh: RX-8891" value={rxRefNo} onChange={e => setRxRefNo(e.target.value)} />
                    </div>
                  </div>

                  {/* Eye details grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0' }}>
                    {/* OD Header */}
                    <div style={{ padding: '6px 10px', background: '#059669', borderRadius: '8px 8px 0 0', color: 'white', fontWeight: 800, fontSize: '0.75rem' }}>👁 MATA KANAN (OD)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '8px', background: 'rgba(5,150,105,0.05)', borderRadius: '0 0 8px 8px', marginBottom: '8px' }}>
                      {[
                        ['SPH', odSph, setOdSph],
                        ['CYL', odCyl, setOdCyl],
                        ['AXIS', odAxis, setOdAxis],
                        ['ADD', odAdd, setOdAdd]
                      ].map(([lbl, val, setter]: any) => (
                        <div key={lbl} className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.65rem' }}>{lbl}</label>
                          <input type="text" className="form-control" style={{ padding: '6px', textAlign: 'center', fontSize: '0.8rem' }}
                            value={val} onChange={e => setter(e.target.value)} />
                        </div>
                      ))}
                    </div>

                    {/* OS Header */}
                    <div style={{ padding: '6px 10px', background: '#0ea5e9', borderRadius: '8px 8px 0 0', color: 'white', fontWeight: 800, fontSize: '0.75rem' }}>👁 MATA KIRI (OS)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '8px', background: 'rgba(14,165,233,0.05)', borderRadius: '0 0 8px 8px', marginBottom: '8px' }}>
                      {[
                        ['SPH', osSph, setOsSph],
                        ['CYL', osCyl, setOsCyl],
                        ['AXIS', osAxis, setOsAxis],
                        ['ADD', osAdd, setOsAdd]
                      ].map(([lbl, val, setter]: any) => (
                        <div key={lbl} className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.65rem' }}>{lbl}</label>
                          <input type="text" className="form-control" style={{ padding: '6px', textAlign: 'center', fontSize: '0.8rem' }}
                            value={val} onChange={e => setter(e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PD & Notes details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <label className="form-label">PD (mm)</label>
                      <input type="text" className="form-control" style={{ textAlign: 'center' }} value={odPd} onChange={e => { setOdPd(e.target.value); setOsPd(e.target.value); }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Catatan Resep Luar</label>
                      <input type="text" className="form-control" placeholder="Catatan kustom resep..." value={rxNotes} onChange={e => setRxNotes(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card text-center text-secondary" style={{ padding: '2rem' }}>
              <ShieldCheck size={40} className="text-success animate-pulse" style={{ margin: '0 auto 0.75rem auto' }} />
              <strong>Pemeriksaan Klinis Dilewati</strong>
              <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Checkout hanya melayani pembelian frame/aksesoris komersial saja.</p>
            </div>
          )}

          <button
            className="btn btn-primary btn-full ripple"
            style={{ marginTop: '2rem', height: '48px' }}
            onClick={() => setStep(3)}
            disabled={!skipExam && rxSource === 'internal' && patientExams.length > 0 && !selectedInternalExam}
          >
            Lanjutkan Ke Pemilihan Produk <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* STEP 3: PILIH PRODUK & KERANJANG */}
      {step === 3 && (
        <div style={{ padding: '1rem' }} className="animate-fade-in">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '0.25rem' }}>3. Pemilihan Item & Keranjang</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Masukkan frame, lensa, aksesoris, atau input item gosokan kustom.</p>

          {/* Cart items list */}
          {cart.length > 0 && (
            <div className="card" style={{ marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
              <span className="section-title" style={{ fontSize: '0.8125rem' }}>🛍️ Keranjang Belanja ({cart.length})</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                {cart.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{rp(c.sell_price)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', borderRadius: '4px' }} onClick={() => updateQty(c.id, -1)}>-</button>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{c.qty}</span>
                      <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', borderRadius: '4px' }} onClick={() => updateQty(c.id, 1)}>+</button>
                      <button type="button" style={{ border: 'none', background: 'transparent', padding: '4px', color: 'var(--danger)' }} onClick={() => removeFromCart(c.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search stock catalog */}
          <div className="search-bar" style={{ margin: '0 0 1rem 0' }}>
            <Search size={18} className="text-secondary" />
            <input
              type="text"
              placeholder="Cari frame, merk, SKU, kacamata..."
              value={stockSearch}
              onChange={e => setStockSearch(e.target.value)}
            />
          </div>

          {/* Custom ad-hoc item trigger */}
          <button
            type="button"
            className="btn btn-secondary btn-full ripple"
            style={{ marginBottom: '1rem', borderStyle: 'dashed', borderWidth: '1.5px', background: 'transparent', color: 'var(--primary)', borderColor: 'var(--primary)' }}
            onClick={() => setShowCustomForm(!showCustomForm)}
          >
            ➕ Tambah Lensa Kustom / Jasa Khusus
          </button>

          {showCustomForm && (
            <div className="card animate-fade-in" style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1.5px dashed var(--primary)' }}>
              <span className="section-title" style={{ fontSize: '0.8125rem' }}>Input Item Kustom / Gosokan</span>
              <div className="form-group">
                <label className="form-label">Nama Item *</label>
                <input type="text" className="form-control" placeholder="Contoh: Lensa Essilor Transition" value={customName} onChange={e => setCustomName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Kategori *</label>
                <select className="form-control" value={customCategory} onChange={e => setCustomCategory(e.target.value as any)}>
                  <option value="lens">Lensa Gosokan</option>
                  <option value="frame">Frame Kustom</option>
                  <option value="service">Jasa Khusus</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Harga Jual (Rp) *</label>
                <input type="number" className="form-control" placeholder="0" value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
              </div>
              <button type="button" className="btn btn-primary ripple" onClick={addCustomItem}>Simpan Item Kustom</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredStock.map(item => (
              <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>{item.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SKU: {item.sku} | Stok: <strong>{item.stock}</strong></p>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>{rp(item.sell_price)}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => addToCart(item)}
                  disabled={item.stock <= 0}
                >
                  {item.stock <= 0 ? 'Habis' : 'Tambah'}
                </button>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <button
              className="btn btn-primary btn-full ripple"
              style={{ marginTop: '2rem', height: '48px' }}
              onClick={() => {
                setStep(4);
                setPayAmount(total); // Default to full pay
              }}
            >
              Lanjutkan Ke Pembayaran <ChevronRight size={18} />
            </button>
          )}
        </div>
      )}

      {/* STEP 4: PEMBAYARAN & CHECKOUT */}
      {step === 4 && (
        <div style={{ padding: '1rem' }} className="animate-fade-in">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '0.25rem' }}>4. Billing & Pembayaran</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Masukkan nominal pembayaran, diskon, dan metode pembayaran.</p>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span>Subtotal:</span>
              <strong>{rp(subtotal)}</strong>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ margin: 0 }}>Potongan Diskon (Rp)</label>
              <input
                type="number"
                className="form-control"
                style={{ width: '120px', textAlign: 'right', padding: '6px' }}
                value={discount || ''}
                onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="divider" />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.0625rem', color: 'var(--primary)' }}>
              <span>Net Total:</span>
              <strong style={{ fontSize: '1.125rem', fontWeight: 800 }}>{rp(total)}</strong>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label">Metode Pembayaran</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'cash', label: 'Cash', icon: DollarSign },
                { id: 'transfer', label: 'Transfer', icon: CreditCard },
                { id: 'debit', label: 'Debit', icon: CreditCard },
                { id: 'credit', label: 'Kredit', icon: CreditCard },
                { id: 'bpjs', label: 'Klaim BPJS', icon: ShieldCheck }
              ].map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{
                      borderRadius: '12px',
                      background: isSelected ? 'var(--primary)' : 'var(--surface)',
                      color: isSelected ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      flexDirection: 'column',
                      height: '60px',
                      gap: '4px'
                    }}
                    onClick={() => setPaymentMethod(method.id as any)}
                  >
                    <Icon size={16} />
                    <span style={{ fontSize: '0.6875rem' }}>{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label">Nominal Dibayar (Rp) *</label>
            <input
              type="number"
              className="form-control"
              placeholder="Masukkan jumlah bayar"
              value={payAmount || ''}
              onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div style={{ marginTop: '0.75rem', padding: '10px', background: sisa > 0 ? 'var(--warning-light)' : 'var(--success-light)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
            {sisa > 0 ? (
              <span className="text-warning">⚠️ Uang Muka (DP). Sisa Piutang: {rp(sisa)}</span>
            ) : (
              <span className="text-success">✅ Pembayaran Lunas</span>
            )}
          </div>

          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label">Catatan Tambahan Transaksi</label>
            <textarea
              className="form-control"
              placeholder="Contoh: Pengambilan hari sabtu, Lensa gosok anti radiasi..."
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary btn-full ripple"
            style={{ marginTop: '2rem', height: '52px', borderRadius: 'var(--radius-md)' }}
            onClick={handleCheckout}
            disabled={checkoutMutation.isPending}
          >
            {checkoutMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Melakukan Checkout...
              </>
            ) : (
              'Checkout & Simpan Order'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
