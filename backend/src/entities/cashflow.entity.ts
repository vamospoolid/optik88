import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';
import { Cashflow, CashflowType } from 'optik88-shared';

@Entity('cashflows')
export class CashflowEntity implements Cashflow {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar' })
  type: CashflowType;

  @Column({ type: 'integer' })
  amount: number;

  @Column()
  category: string;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: string;

  @Column()
  created_by: string;
}
