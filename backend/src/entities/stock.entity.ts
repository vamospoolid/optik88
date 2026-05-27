import { Entity, Column, PrimaryColumn, VersionColumn } from 'typeorm';
import { StockItem as IStockItem } from 'optik88-shared';

@Entity('stock_items')
export class StockItemEntity implements IStockItem {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar' })
  category: 'frame' | 'lens' | 'service';

  @Column()
  brand: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  sku?: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ type: 'integer' })
  modal_price: number;

  @Column({ type: 'integer' })
  sell_price: number;

  @Column({ type: 'integer' })
  stock: number;

  @Column({ type: 'integer' })
  min_stock: number;

  @Column({ nullable: true })
  supplier?: string;

  @Column({ nullable: true })
  description?: string;

  @VersionColumn()
  version: number;
}
