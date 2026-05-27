import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockItemEntity } from '../../entities/stock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockItemEntity])],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
