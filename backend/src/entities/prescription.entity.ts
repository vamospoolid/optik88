import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Prescription as IPrescription } from 'optik88-shared';
import { EyeExaminationEntity } from './examination.entity';
import { PrescriptionDetailEntity } from './prescription-detail.entity';

@Entity('prescriptions')
export class PrescriptionEntity implements IPrescription {
  @PrimaryColumn()
  id: string;

  @Column()
  examination_id: string;

  @Column({ type: 'varchar' })
  type: 'monofocal' | 'bifocal' | 'progressive';

  @Column({ type: 'integer', nullable: true })
  pd?: number;

  @OneToOne(() => EyeExaminationEntity, (exam) => exam.prescription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examination_id' })
  examination: EyeExaminationEntity;

  @OneToMany(() => PrescriptionDetailEntity, (detail) => detail.prescription, { cascade: true, eager: true })
  details: PrescriptionDetailEntity[];
}
