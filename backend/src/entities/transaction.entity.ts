import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Transaction as ITransaction, PaymentMethod, PaymentStatus, OrderStatus } from 'optik88-shared';
import { PatientEntity } from './patient.entity';
import { PrescriptionEntity } from './prescription.entity';
import { TransactionItemEntity } from './transaction-item.entity';

@Entity('transactions')
export class TransactionEntity implements ITransaction {
  @PrimaryColumn()
  id: string;

  @Column()
  invoice_number: string;

  @Column()
  patient_id: string;

  @Column({ nullable: true })
  prescription_id?: string;

  @Column({ type: 'integer' })
  discount: number;

  @Column({ type: 'integer' })
  subtotal: number;

  @Column({ type: 'integer' })
  total_amount: number;

  @Column({ type: 'integer' })
  paid_amount: number;

  @Column({ type: 'integer' })
  remaining_amount: number;

  @Column({ type: 'varchar' })
  payment_method: PaymentMethod;

  @Column({ type: 'varchar' })
  payment_status: PaymentStatus;

  @Column({ type: 'varchar' })
  order_status: OrderStatus;

  @Column({ nullable: true })
  notes?: string;

  @Column()
  created_at: string;

  @Column()
  created_by: string;

  @ManyToOne(() => PatientEntity, (patient) => patient.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: PatientEntity;

  @ManyToOne(() => PrescriptionEntity, { nullable: true })
  @JoinColumn({ name: 'prescription_id' })
  prescription?: PrescriptionEntity;

  @OneToMany(() => TransactionItemEntity, (item) => item.transaction, { cascade: true, eager: true })
  items: TransactionItemEntity[];
}
