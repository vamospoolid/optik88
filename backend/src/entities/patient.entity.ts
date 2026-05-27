import { Entity, Column, PrimaryColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Patient as IPatient } from 'optik88-shared';
import { EyeExaminationEntity } from './examination.entity';
import { TransactionEntity } from './transaction.entity';

@Entity('patients')
export class PatientEntity implements IPatient {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  nik?: string;

  @Column({ type: 'varchar', nullable: true })
  gender?: 'male' | 'female';

  @Column({ nullable: true })
  birth_date?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  bpjs_number?: string;

  @CreateDateColumn()
  created_at?: string;

  @OneToMany(() => EyeExaminationEntity, (exam) => exam.patient)
  examinations: EyeExaminationEntity[];

  @OneToMany(() => TransactionEntity, (trx) => trx.patient)
  transactions: TransactionEntity[];
}
