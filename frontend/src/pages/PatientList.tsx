import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Phone, MapPin, Loader2, Save, Activity, Users, UserPlus, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsService } from '../services/api';
import type { Patient } from 'optik88-shared';
import './PatientList.css';

const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Responsive form state
  const [showForm, setShowForm] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowForm(true);
      } else {
        setShowForm(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Form State
  const [patientType, setPatientType] = useState<'umum' | 'bpjs'>('umum');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birth_date: '',
    address: '',
    bpjs_number: ''
  });

  const { data: patients = [], isLoading, isError } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: patientsService.getAll,
  });

  const addPatientMutation = useMutation({
    mutationFn: patientsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      // Reset form
      setFormData({ name: '', phone: '', birth_date: '', address: '', bpjs_number: '' });
      setPatientType('umum');
      // On mobile, automatically close form after success
      if (window.innerWidth < 1024) {
        setShowForm(false);
      }
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;
    
    await addPatientMutation.mutateAsync({
      name: formData.name,
      phone: formData.phone,
      birth_date: formData.birth_date || undefined,
      address: formData.address || undefined,
      bpjs_number: patientType === 'bpjs' ? formData.bpjs_number || undefined : undefined
    } as Partial<Patient>);
  };

  const filteredPatients = patients.filter((p) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.phone && p.phone.includes(searchTerm)) ||
    (p.bpjs_number && p.bpjs_number.includes(searchTerm))
  );

  return (
    <div className="patient-list-page animate-fade-in">
      
      {/* ── Unified Premium Hero ── */}
      <div className="patient-hero">
        <div className="ph-content">
          <div className="ph-icon">
            <Users size={28} />
          </div>
          <div>
            <h1>Manajemen Pasien</h1>
            <p>Kelola profil dan rekam medis {patients.length} pasien.</p>
          </div>
        </div>
        <button 
          className="ph-action-btn" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X size={18} /> : <UserPlus size={18} />}
          <span>{showForm ? 'Tutup Form' : 'Pasien Baru'}</span>
        </button>
      </div>

      <div className="patient-layout">
        
        {/* ── Main Content: Search & List ── */}
        <div className="patient-main">
          <div className="search-bar-container">
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input 
                type="text" 
                className="form-control search-input" 
                placeholder="Cari nama, No. HP, atau No BPJS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[250px] flex-col gap-2">
              <Loader2 size={36} className="animate-spin text-primary" />
              <p className="text-gray-500">Memuat data pasien...</p>
            </div>
          ) : isError ? (
            <div className="empty-state">
              <div className="empty-icon text-danger"><User size={48} /></div>
              <h3>Gagal memuat data</h3>
              <p>Terjadi kesalahan saat menghubungi server backend.</p>
            </div>
          ) : (
            <>
              <div className="patient-list-container">
                {filteredPatients.map((patient: Patient) => (
                  <div 
                    key={patient.id} 
                    className="patient-list-item"
                    onClick={() => navigate(`/pasien/${patient.id}`)}
                  >
                    <div className="pli-avatar">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="pli-content">
                      <div className="pli-header">
                        <span className="pli-name">{patient.name}</span>
                        <span className={`badge badge-sm ${patient.bpjs_number ? 'badge-success' : 'badge-secondary'}`}>
                          {patient.bpjs_number ? 'BPJS' : 'Umum'}
                        </span>
                      </div>
                      <div className="pli-details">
                        <span className="pli-info"><Phone size={12} /> {patient.phone || 'Tidak ada HP'}</span>
                        {patient.bpjs_number && <span className="pli-info"><Activity size={12} /> {patient.bpjs_number}</span>}
                        {patient.address && <span className="pli-info truncate-1"><MapPin size={12} /> {patient.address}</span>}
                      </div>
                    </div>
                    <div className="pli-action">
                      <span>Detail &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredPatients.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon"><User size={48} /></div>
                  <h3>Pasien tidak ditemukan</h3>
                  <p>Coba gunakan kata kunci lain.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Sidebar: Registration Form ── */}
        <div className={`patient-sidebar ${showForm ? 'active' : ''}`}>
          <div className="registration-card sticky-card">
            <div className="registration-header">
              <h3>Daftarkan Pasien Baru</h3>
              <p>Lengkapi formulir di bawah ini.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-type-selector">
                <label className={`type-radio ${patientType === 'umum' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="type" 
                    checked={patientType === 'umum'} 
                    onChange={() => setPatientType('umum')} 
                  />
                  <User size={16} /> Pasien Umum
                </label>
                <label className={`type-radio ${patientType === 'bpjs' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="type" 
                    checked={patientType === 'bpjs'} 
                    onChange={() => setPatientType('bpjs')} 
                  />
                  <Activity size={16} /> BPJS
                </label>
              </div>

              <div className="form-grid-single">
                <div className="form-group">
                  <label>Nama Lengkap *</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-control" 
                    placeholder="Contoh: Budi Santoso"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Nomor HP *</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    className="form-control" 
                    placeholder="Contoh: 08123456789"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tanggal Lahir</label>
                  <input 
                    type="date" 
                    name="birth_date" 
                    className="form-control" 
                    value={formData.birth_date}
                    onChange={handleInputChange}
                  />
                </div>

                {patientType === 'bpjs' && (
                  <div className="form-group slide-down">
                    <label>Nomor BPJS</label>
                    <input 
                      type="text" 
                      name="bpjs_number" 
                      className="form-control" 
                      placeholder="Masukkan Nomor BPJS"
                      value={formData.bpjs_number}
                      onChange={handleInputChange}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Alamat Lengkap</label>
                  <textarea 
                    name="address" 
                    className="form-control" 
                    placeholder="Contoh: Jl. Sudirman No. 1..."
                    rows={2}
                    value={formData.address}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>

              <div className="form-actions mt-4">
                <button 
                  type="submit" 
                  className="btn-submit-patient"
                  disabled={addPatientMutation.isPending || !formData.name.trim() || !formData.phone.trim()}
                >
                  {addPatientMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {addPatientMutation.isPending ? 'Menyimpan...' : 'Simpan Data Pasien'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientList;
