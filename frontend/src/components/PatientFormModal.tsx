import React, { useState } from 'react';
import { X, Save, User, Phone, MapPin, CreditCard, Calendar } from 'lucide-react';
import type { Patient } from 'optik88-shared';
import './PatientFormModal.css';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
}

const PatientFormModal: React.FC<PatientFormModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    phone: '',
    nik: '',
    gender: 'male',
    birth_date: '',
    address: '',
    bpjs_number: ''
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.name) return;

    // Generate a mock ID
    const newPatient: Patient = {
      id: `P${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: formData.name,
      phone: formData.phone || undefined,
      nik: formData.nik || undefined,
      gender: formData.gender as "male" | "female",
      birth_date: formData.birth_date || undefined,
      address: formData.address || undefined,
      bpjs_number: formData.bpjs_number || undefined,
    };

    onSave(newPatient);
    
    // Reset form
    setFormData({
      name: '',
      phone: '',
      nik: '',
      gender: 'male',
      birth_date: '',
      address: '',
      bpjs_number: ''
    });
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Tambah Pasien Baru</h2>
          <button className="btn-icon" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Nama Lengkap *</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  name="name"
                  className="form-control" 
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group flex-1">
              <label className="form-label">Nomor HP</label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon" />
                <input 
                  type="tel" 
                  name="phone"
                  className="form-control" 
                  placeholder="Contoh: 081234567890"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-row">
             <div className="form-group flex-1">
              <label className="form-label">Jenis Kelamin</label>
              <select 
                name="gender" 
                className="form-control"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
            
            <div className="form-group flex-1">
              <label className="form-label">Tanggal Lahir</label>
              <div className="input-with-icon">
                <Calendar size={18} className="input-icon" />
                <input 
                  type="date" 
                  name="birth_date"
                  className="form-control"
                  value={formData.birth_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">NIK (Nomor Induk Kependudukan)</label>
              <div className="input-with-icon">
                <CreditCard size={18} className="input-icon" />
                <input 
                  type="text" 
                  name="nik"
                  className="form-control" 
                  placeholder="16 digit NIK"
                  value={formData.nik}
                  onChange={handleChange}
                  maxLength={16}
                />
              </div>
            </div>
            
            <div className="form-group flex-1">
              <label className="form-label">Nomor BPJS (Opsional)</label>
              <div className="input-with-icon">
                <CreditCard size={18} className="input-icon" />
                <input 
                  type="text" 
                  name="bpjs_number"
                  className="form-control" 
                  placeholder="Nomor BPJS Kesehatan"
                  value={formData.bpjs_number}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Alamat Lengkap</label>
            <div className="input-with-icon align-top">
              <MapPin size={18} className="input-icon mt-3" />
              <textarea 
                name="address"
                className="form-control" 
                placeholder="Alamat tempat tinggal pasien"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                style={{ paddingLeft: '2.75rem', paddingTop: '0.75rem' }}
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary shadow-glow">
              <Save size={18} /> Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientFormModal;
