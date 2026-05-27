import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { EyeExamination as IEyeExamination } from 'optik88-shared';
import { PatientEntity } from './patient.entity';
import { PrescriptionEntity } from './prescription.entity';

@Entity('examinations')
export class EyeExaminationEntity implements IEyeExamination {
  @PrimaryColumn()
  id: string;

  @Column()
  patient_id: string;

  @Column({ type: 'varchar' })
  source: 'external' | 'internal';

  @Column({ type: 'varchar', nullable: true })
  external_source_type?: 'bpjs' | 'klinik' | 'dokter_praktek' | 'rumah_sakit' | 'lainnya';

  @Column({ nullable: true })
  doctor_name?: string;

  @Column({ nullable: true })
  facility_name?: string;

  @Column({ nullable: true })
  reference_number?: string;

  @Column()
  exam_date: string;

  @Column({ nullable: true })
  notes?: string;

  @ManyToOne(() => PatientEntity, (patient) => patient.examinations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  @OneToOne(() => PrescriptionEntity, (prescription) => prescription.examination)
  prescription: PrescriptionEntity;
}
