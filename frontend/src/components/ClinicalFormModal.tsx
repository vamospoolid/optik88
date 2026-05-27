import React, { useState } from 'react';
import { X, Save, Eye, FileText, Activity, Stethoscope, AlertCircle, Glasses } from 'lucide-react';
import type { EyeExamination, Prescription, PrescriptionDetail } from 'optik88-shared';
import './ClinicalFormModal.css';

interface ClinicalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'internal' | 'external';
  patientId: string;
  onSave: (exam: EyeExamination, prescription: Prescription) => void;
}

const ClinicalFormModal: React.FC<ClinicalFormModalProps> = ({ isOpen, onClose, type, patientId, onSave }) => {
  const [examData, setExamData] = useState<Partial<EyeExamination>>({
    source: type,
    exam_date: new Date().toISOString().split('T')[0],
    external_source_type: 'bpjs',
    doctor_name: '',
    facility_name: '',
    reference_number: '',
    notes: '',
  });

  const [rxRight, setRxRight] = useState<Partial<PrescriptionDetail>>({
    eye: 'R', sph: 0, cyl: 0, axis: 0, add_power: 0
  });
  
  const [rxLeft, setRxLeft] = useState<Partial<PrescriptionDetail>>({
    eye: 'L', sph: 0, cyl: 0, axis: 0, add_power: 0
  });

  const [prescriptionData, setPrescriptionData] = useState<Partial<Prescription>>({
    type: 'monofocal',
    pd: 64,
  });

  // Additional fields for internal exam
  const [complaint, setComplaint] = useState('');
  const [recommendation, setRecommendation] = useState('');

  if (!isOpen) return null;

  const handleExamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExamData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const examId = `E${Math.floor(Math.random() * 10000)}`;
    
    // Format Notes combining complaints/recommendations if internal
    let finalNotes = examData.notes || '';
    if (type === 'internal') {
      finalNotes = `Keluhan: ${complaint}\nRekomendasi: ${recommendation}\nCatatan: ${finalNotes}`;
    }

    const newExam: EyeExamination = {
      id: examId,
      patient_id: patientId,
      source: type,
      exam_date: examData.exam_date || '',
      external_source_type: type === 'external' ? examData.external_source_type as any : undefined,
      doctor_name: examData.doctor_name,
      facility_name: examData.facility_name,
      reference_number: examData.reference_number,
      notes: finalNotes
    };

    const newPrescription: Prescription = {
      id: `PR${Math.floor(Math.random() * 10000)}`,
      examination_id: examId,
      type: prescriptionData.type as any,
      pd: prescriptionData.pd,
      details: [
        { eye: 'R', sph: Number(rxRight.sph) || 0, cyl: Number(rxRight.cyl) || undefined, axis: Number(rxRight.axis) || undefined, add_power: Number(rxRight.add_power) || undefined },
        { eye: 'L', sph: Number(rxLeft.sph) || 0, cyl: Number(rxLeft.cyl) || undefined, axis: Number(rxLeft.axis) || undefined, add_power: Number(rxLeft.add_power) || undefined }
      ]
    };

    onSave(newExam, newPrescription);
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content clinical-modal">
        <div className={`modal-header ${type === 'internal' ? 'bg-success-light border-bottom-success' : 'bg-warning-light border-bottom-warning'}`}>
          <div className="clinical-header-title">
            {type === 'internal' ? (
              <><Eye className="text-secondary" size={24} /> <h2>Pemeriksaan Optik Internal</h2></>
            ) : (
              <><FileText className="text-warning" size={24} /> <h2>Input Resep Dokter Luar</h2></>
            )}
          </div>
          <button className="btn-icon" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body clinical-body">
          <div className="clinical-layout">
            
            {/* Left Column: Metadata & Details */}
            <div className="clinical-metadata">
              <h3 className="section-title-sm">Informasi Pemeriksaan</h3>
              
              <div className="form-group">
                <label className="form-label">Tanggal Pemeriksaan *</label>
                <input type="date" name="exam_date" className="form-control" value={examData.exam_date} onChange={handleExamChange} required />
              </div>

              {type === 'external' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Sumber Resep</label>
                    <select name="external_source_type" className="form-control" value={examData.external_source_type} onChange={handleExamChange}>
                      <option value="bpjs">BPJS</option>
                      <option value="rumah_sakit">Rumah Sakit</option>
                      <option value="klinik">Klinik</option>
                      <option value="dokter_praktek">Dokter Praktek</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nama Dokter (Opsional)</label>
                    <div className="input-with-icon">
                      <Stethoscope size={16} className="input-icon" />
                      <input type="text" name="doctor_name" className="form-control" placeholder="Dr. Spesialis Mata" value={examData.doctor_name} onChange={handleExamChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nama Fasilitas/Klinik (Opsional)</label>
                    <input type="text" name="facility_name" className="form-control" placeholder="RSUD / Klinik Utama" value={examData.facility_name} onChange={handleExamChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">No. Rujukan / Surat (Opsional)</label>
                    <input type="text" name="reference_number" className="form-control" placeholder="No. BPJS atau Surat" value={examData.reference_number} onChange={handleExamChange} />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Nama Optometris/RO</label>
                    <div className="input-with-icon">
                      <Activity size={16} className="input-icon" />
                      <input type="text" name="doctor_name" className="form-control" placeholder="Nama Pemeriksa" value={examData.doctor_name} onChange={handleExamChange} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Keluhan Utama Pasien</label>
                    <div className="input-with-icon align-top">
                      <AlertCircle size={16} className="input-icon mt-3" />
                      <textarea className="form-control" placeholder="Pandangan kabur saat malam, dll." rows={2} value={complaint} onChange={(e) => setComplaint(e.target.value)} style={{ paddingLeft: '2.5rem', paddingTop: '0.75rem' }} />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group mt-auto">
                <label className="form-label">Catatan Tambahan</label>
                <textarea name="notes" className="form-control" placeholder="Catatan resep..." rows={3} value={examData.notes} onChange={handleExamChange} />
              </div>
            </div>

            {/* Right Column: Rx Data */}
            <div className="clinical-rx-data">
              <h3 className="section-title-sm flex-center"><Glasses size={18} className="mr-2"/> Data Refraksi (Resep Kacamata)</h3>
              
              <div className="rx-table-container">
                <table className="rx-table">
                  <thead>
                    <tr>
                      <th>MATA</th>
                      <th>SPH (Spherical)</th>
                      <th>CYL (Cylinder)</th>
                      <th>AXIS</th>
                      <th>ADD (Addition)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Right Eye (OD) */}
                    <tr className="rx-row-od">
                      <td className="eye-label">
                        <strong>OD</strong>
                        <span className="eye-desc">Oculus Dexter (Kanan)</span>
                      </td>
                      <td>
                        <input type="number" step="0.25" className="rx-input" value={rxRight.sph} onChange={e => setRxRight({...rxRight, sph: e.target.value as any})} />
                      </td>
                      <td>
                        <input type="number" step="0.25" className="rx-input" value={rxRight.cyl} onChange={e => setRxRight({...rxRight, cyl: e.target.value as any})} />
                      </td>
                      <td>
                        <input type="number" step="1" min="0" max="180" className="rx-input" value={rxRight.axis} onChange={e => setRxRight({...rxRight, axis: e.target.value as any})} />
                      </td>
                      <td>
                        <input type="number" step="0.25" min="0" className="rx-input" value={rxRight.add_power} onChange={e => setRxRight({...rxRight, add_power: e.target.value as any})} />
                      </td>
                    </tr>
                    
                    {/* Left Eye (OS) */}
                    <tr className="rx-row-os">
                      <td className="eye-label">
                        <strong>OS</strong>
                        <span className="eye-desc">Oculus Sinister (Kiri)</span>
                      </td>
                      <td>
                        <input type="number" step="0.25" className="rx-input" value={rxLeft.sph} onChange={e => setRxLeft({...rxLeft, sph: e.target.value as any})} />
                      </td>
                      <td>
                        <input type="number" step="0.25" className="rx-input" value={rxLeft.cyl} onChange={e => setRxLeft({...rxLeft, cyl: e.target.value as any})} />
                      </td>
                      <td>
                        <input type="number" step="1" min="0" max="180" className="rx-input" value={rxLeft.axis} onChange={e => setRxLeft({...rxLeft, axis: e.target.value as any})} />
                      </td>
                      <td>
                        <input type="number" step="0.25" min="0" className="rx-input" value={rxLeft.add_power} onChange={e => setRxLeft({...rxLeft, add_power: e.target.value as any})} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rx-accessories">
                <div className="form-group pd-group">
                  <label className="form-label">PD (Pupillary Distance) mm</label>
                  <div className="pd-input-wrap">
                    <input type="number" step="1" className="form-control text-center text-lg font-bold" value={prescriptionData.pd} onChange={e => setPrescriptionData({...prescriptionData, pd: Number(e.target.value)})} />
                  </div>
                </div>
                
                <div className="form-group flex-1">
                  <label className="form-label">Rekomendasi Tipe Lensa</label>
                  <select className="form-control" value={prescriptionData.type} onChange={e => setPrescriptionData({...prescriptionData, type: e.target.value as any})}>
                    <option value="monofocal">Monofocal (Single Vision)</option>
                    <option value="bifocal">Bifocal (Kryptok/Flattop)</option>
                    <option value="progressive">Progressive</option>
                  </select>
                </div>
              </div>

              {type === 'internal' && (
                <div className="form-group mt-4 bg-surface-hover p-3 rounded-lg border-dashed">
                  <label className="form-label">Hasil Trial Lens & Rekomendasi Klinis</label>
                  <textarea 
                    className="form-control" 
                    placeholder="Visus mencapai 6/6 dengan koreksi... Lensa disarankan anti-radiasi blue-ray..." 
                    rows={4} 
                    value={recommendation} 
                    onChange={e => setRecommendation(e.target.value)} 
                  />
                </div>
              )}

            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className={`btn btn-primary shadow-glow ${type === 'internal' ? 'bg-secondary' : 'bg-warning'}`}>
              <Save size={18} /> Simpan Rekam Medis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClinicalFormModal;
