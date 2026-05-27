import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashflowEntity } from '../../entities/cashflow.entity';
import { TransactionEntity } from '../../entities/transaction.entity';
import { CashflowService } from './cashflow.service';
import { CashflowController } from './cashflow.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CashflowEntity, TransactionEntity])],
  controllers: [CashflowController],
  providers: [CashflowService],
})
export class CashflowModule {}
