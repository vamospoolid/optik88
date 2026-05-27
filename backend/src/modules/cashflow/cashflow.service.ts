import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { CashflowEntity } from '../../entities/cashflow.entity';
import { TransactionEntity } from '../../entities/transaction.entity';
import { Cashflow, CashflowSummary } from 'optik88-shared';
import * as crypto from 'crypto';

@Injectable()
export class CashflowService {
  constructor(
    @InjectRepository(CashflowEntity)
    private cashflowRepo: Repository<CashflowEntity>,
    @InjectRepository(TransactionEntity)
    private transactionRepo: Repository<TransactionEntity>,
  ) {}

  async create(data: Partial<Cashflow>): Promise<CashflowEntity> {
    const cashflow = this.cashflowRepo.create({
      id: `CF-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      type: data.type,
      amount: data.amount,
      category: data.category || 'manual',
      notes: data.notes,
      created_by: data.created_by || 'Kasir',
    });
    return this.cashflowRepo.save(cashflow);
  }

  async getAll(period?: string): Promise<any[]> {
    const now = new Date();
    let fromDate: Date | null = null;

    if (period === 'daily') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'weekly') {
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'monthly') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Manual cashflow entries
    const manualEntries = fromDate
      ? await this.cashflowRepo.find({
          where: { created_at: MoreThanOrEqual(fromDate.toISOString()) },
          order: { created_at: 'DESC' },
        })
      : await this.cashflowRepo.find({ order: { created_at: 'DESC' } });

    // POS Transactions as virtual income entries
    const trxWhere: any = {};
    if (fromDate) trxWhere.created_at = MoreThanOrEqual(fromDate.toISOString());

    const transactions = await this.transactionRepo.find({
      where: trxWhere,
      order: { created_at: 'DESC' },
    });

    const posEntries = transactions
      .filter(tx => tx.order_status !== 'dibatalkan' && tx.paid_amount > 0)
      .map(tx => ({
        id: `TRX-CF-${tx.id}`,
        type: 'INCOME',
        amount: tx.paid_amount,
        category: 'pos_transaction',
        notes: `Penjualan ${tx.invoice_number} (${(tx.payment_method || '').toUpperCase()})`,
        created_at: tx.created_at,
        created_by: tx.created_by,
        source: 'pos',
        invoice_number: tx.invoice_number,
      }));

    // Merge and sort by date DESC
    const merged = [
      ...manualEntries.map(e => ({ ...e, source: 'manual' })),
      ...posEntries,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return merged;
  }

  async getTodaySummary(): Promise<CashflowSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const manualCashflows = await this.cashflowRepo.find({
      where: { created_at: Between(today.toISOString(), tomorrow.toISOString()) },
    });

    let total_manual_income = 0;
    let total_expense = 0;
    manualCashflows.forEach(cf => {
      if (cf.type === 'INCOME') total_manual_income += cf.amount;
      else if (cf.type === 'EXPENSE') total_expense += cf.amount;
    });

    const transactions = await this.transactionRepo.find({
      where: { created_at: Between(today.toISOString(), tomorrow.toISOString()) },
    });

    let total_auto_income = 0;
    transactions.forEach(tx => {
      if (tx.order_status !== 'dibatalkan' && tx.paid_amount > 0) {
        total_auto_income += tx.paid_amount;
      }
    });

    const net_balance = total_auto_income + total_manual_income - total_expense;
    return { total_auto_income, total_manual_income, total_expense, net_balance };
  }

  async getTodayRecords(): Promise<CashflowEntity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.cashflowRepo.find({
      where: { created_at: Between(today.toISOString(), tomorrow.toISOString()) },
      order: { created_at: 'DESC' },
    });
  }
}
