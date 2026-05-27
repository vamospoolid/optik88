import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, X, Loader2 } from 'lucide-react';
import { patientsService } from '../services/api';

export default function PatientList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAddParam = searchParams.get('add') === 'true';

  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(isAddParam);

  // New Patient Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [nik, setNik] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<'umum' | 'bpjs'>('umum');
  const [bpjsNumber, setBpjsNumber] = useState('');

  // Fetch Patients Query
  const { data: patients = [], isLoading } = useQuery<any[]>({
    queryKey: ['patients'],
    queryFn: patientsService.getAll,
  });

  // Create Patient Mutation
  const createMutation = useMutation({
    mutationFn: patientsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      handleCloseForm();
    },
  });

  const handleCloseForm = () => {
    setShowAddForm(false);
    setSearchParams({}); // Clear query param
    // Reset Form
    setName('');
    setPhone('');
    setGender('male');
    setNik('');
    setBirthDate('');
    setAddress('');
    setType('umum');
    setBpjsNumber('');
  };

  useEffect(() => {
    if (isAddParam) {
      setShowAddForm(true);
    }
  }, [isAddParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createMutation.mutate({
      name: name.trim(),
      phone: phone.trim() || undefined,
      gender,
      nik: nik.trim() || undefined,
      birth_date: birthDate || undefined,
      address: address.trim() || undefined,
      bpjs_number: type === 'bpjs' ? bpjsNumber.trim() || undefined : undefined,
    });
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone && p.phone.includes(search)) ||
    (p.nik && p.nik.includes(search)) ||
    (p.bpjs_number && p.bpjs_number.includes(search))
  );

  return (
    <div className="page-scroll animate-fade-in">
      {/* Header Sticky */}
      <div className="top-bar">
        <span className="top-bar-title">Data Pasien</span>
        <button className="top-bar-action" onClick={() => setShowAddForm(true)}>
          <Plus size={20} />
        </button>
      </div>

      {/* Sticky Search Box */}
      <div className="search-bar">
        <Search size={18} className="text-secondary" />
        <input
          type="text"
          placeholder="Cari nama, No. HP, atau No. BPJS..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button style={{ border: 'none', background: 'transparent' }} onClick={() => setSearch('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Patients List */}
      <div className="card-list" style={{ marginBottom: '2rem' }}>
        {isLoading ? (
          <div className="loading-center">
            <Loader2 size={32} className="animate-spin text-primary" />
            <span>Memuat data pasien...</span>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="empty-state card">
            <h3>Pasien Tidak Ditemukan</h3>
            <p>Tidak ada hasil untuk pencarian "{search}".</p>
          </div>
        ) : (
          filteredPatients.map(p => {
            const isBpjs = !!p.bpjs_number;
            return (
              <div
                key={p.id}
                className="list-item ripple"
                onClick={() => navigate(`/pasien/${p.id}`)}
              >
                <div className="list-item-avatar" style={{ background: isBpjs ? 'var(--info)' : 'var(--primary)' }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{p.name}</div>
                  <div className="list-item-sub">HP: {p.phone || '—'}</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className={`badge ${isBpjs ? 'badge-cyan' : 'badge-gray'}`} style={{ fontSize: '0.625rem' }}>
                    {isBpjs ? 'BPJS' : 'UMUM'}
                  </span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{p.id}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Floating Action Button */}
      <button className="fab" onClick={() => setShowAddForm(true)} aria-label="Tambah Pasien">
        <Plus size={24} />
      </button>

      {/* Bottom Sheet Modal for Registration */}
      {showAddForm && (
        <>
          <div className="sheet-backdrop" onClick={handleCloseForm} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <span className="sheet-title">Pendaftaran Pasien Baru</span>
              <button className="sheet-close" onClick={handleCloseForm}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="sheet-body">
                {/* Classification Toggle Option */}
                <div className="form-group">
                  <label className="form-label">Klasifikasi Pasien</label>
                  <div className="flex" style={{ background: 'var(--bg)', borderRadius: '12px', padding: '4px', gap: '4px' }}>
                    <button
                      type="button"
                      className="flex-1 btn btn-sm"
                      style={{
                        borderRadius: '8px',
                        background: type === 'umum' ? 'var(--surface)' : 'transparent',
                        color: type === 'umum' ? 'var(--primary)' : 'var(--text-secondary)',
                        boxShadow: type === 'umum' ? 'var(--shadow-sm)' : 'none',
                        fontWeight: 600
                      }}
                      onClick={() => setType('umum')}
                    >
                      PASIEN UMUM
                    </button>
                    <button
                      type="button"
                      className="flex-1 btn btn-sm"
                      style={{
                        borderRadius: '8px',
                        background: type === 'bpjs' ? 'var(--surface)' : 'transparent',
                        color: type === 'bpjs' ? 'var(--primary)' : 'var(--text-secondary)',
                        boxShadow: type === 'bpjs' ? 'var(--shadow-sm)' : 'none',
                        fontWeight: 600
                      }}
                      onClick={() => setType('bpjs')}
                    >
                      PASIEN BPJS
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Lengkap *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Masukkan nama lengkap"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nomor Kontak / HP</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Contoh: 0812345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                {type === 'bpjs' && (
                  <div className="form-group animate-fade-in" style={{ padding: '10px', background: 'var(--info-light)', borderRadius: '12px', border: '1px solid var(--info)' }}>
                    <label className="form-label text-primary font-bold">Nomor Kartu BPJS *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Masukkan No. BPJS Kesehatan"
                      value={bpjsNumber}
                      onChange={e => setBpjsNumber(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">NIK (KTP)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="16 digit NIK"
                    value={nik}
                    onChange={e => setNik(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tanggal Lahir</label>
                  <input
                    type="date"
                    className="form-control"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Jenis Kelamin</label>
                  <select
                    className="form-control"
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                  >
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat Lengkap</label>
                  <textarea
                    className="form-control"
                    placeholder="Alamat tempat tinggal saat ini..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full ripple"
                  style={{ marginTop: '0.5rem', height: '48px' }}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Mendaftarkan...
                    </>
                  ) : (
                    'Daftarkan Pasien'
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
