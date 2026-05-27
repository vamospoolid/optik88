import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PrescriptionDetail as IPrescriptionDetail } from 'optik88-shared';
import { PrescriptionEntity } from './prescription.entity';

@Entity('prescription_details')
export class PrescriptionDetailEntity implements IPrescriptionDetail {
  @PrimaryColumn({ type: 'varchar' })
  prescription_id: string;

  @PrimaryColumn({ type: 'varchar' })
  eye: 'R' | 'L';

  @Column({ type: 'float' })
  sph: number;

  @Column({ type: 'float', nullable: true })
  cyl?: number;

  @Column({ type: 'integer', nullable: true })
  axis?: number;

  @Column({ type: 'float', nullable: true })
  add_power?: number;

  @ManyToOne(() => PrescriptionEntity, (prescription) => prescription.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prescription_id' })
  prescription: PrescriptionEntity;
}
