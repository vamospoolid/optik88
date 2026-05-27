import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockItemEntity } from '../../entities/stock.entity';
import { StockItem as IStockItem } from 'optik88-shared';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockItemEntity)
    private readonly stockRepo: Repository<StockItemEntity>,
  ) {}

  async findAll(): Promise<StockItemEntity[]> {
    return this.stockRepo.find({
      order: { brand: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<StockItemEntity> {
    const item = await this.stockRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Stock item with ID ${id} not found`);
    }
    return item;
  }

  async create(data: Partial<IStockItem>): Promise<StockItemEntity> {
    if (!data.id) {
      const count = await this.stockRepo.count();
      const prefix = data.category === 'frame' ? 'F' : data.category === 'lens' ? 'L' : 'S';
      data.id = `${prefix}${String(count + 1).padStart(3, '0')}`;
    }
    const item = this.stockRepo.create(data);
    return this.stockRepo.save(item);
  }

  async update(id: string, data: Partial<IStockItem>): Promise<StockItemEntity> {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.stockRepo.save(item);
  }

  async adjustStock(id: string, adjustment: number): Promise<StockItemEntity> {
    const item = await this.findOne(id);
    item.stock = Math.max(0, item.stock + adjustment);
    return this.stockRepo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.stockRepo.remove(item);
  }
}
