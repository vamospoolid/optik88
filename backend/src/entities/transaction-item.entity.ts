import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TransactionItem as ITransactionItem } from 'optik88-shared';
import { TransactionEntity } from './transaction.entity';

@Entity('transaction_items')
export class TransactionItemEntity implements ITransactionItem {
  @PrimaryColumn()
  id: string;

  @Column()
  transaction_id: string;

  @Column({ type: 'varchar' })
  product_type: 'frame' | 'lens' | 'service';

  @Column({ nullable: true })
  product_id?: string;

  @Column()
  name: string;

  @Column({ type: 'integer' })
  original_price: number;

  @Column({ type: 'integer' })
  sell_price: number;

  @Column({ type: 'integer' })
  qty: number;

  @Column({ type: 'integer' })
  subtotal: number;

  @ManyToOne(() => TransactionEntity, (trx) => trx.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_id' })
  transaction: TransactionEntity;
}
