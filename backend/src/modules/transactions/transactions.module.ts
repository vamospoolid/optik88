import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionEntity } from '../../entities/transaction.entity';
import { TransactionItemEntity } from '../../entities/transaction-item.entity';
import { StockItemEntity } from '../../entities/stock.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionEntity,
      TransactionItemEntity,
      StockItemEntity,
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
