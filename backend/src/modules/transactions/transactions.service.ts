import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { TransactionEntity } from '../../entities/transaction.entity';
import { TransactionItemEntity } from '../../entities/transaction-item.entity';
import { StockItemEntity } from '../../entities/stock.entity';
import { Transaction as ITransaction } from 'optik88-shared';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
    private readonly entityManager: EntityManager,
  ) {}

  async findAll(): Promise<TransactionEntity[]> {
    return this.transactionRepo.find({
      relations: ['patient', 'prescription', 'items'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TransactionEntity> {
    const trx = await this.transactionRepo.findOne({
      where: { id },
      relations: ['patient', 'prescription', 'items'],
    });
    if (!trx) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return trx;
  }

  async create(data: Partial<ITransaction>): Promise<TransactionEntity> {
    return this.entityManager.transaction(async (manager) => {
      // 1. Validate data
      if (!data.patient_id) {
        throw new BadRequestException('Patient ID is required');
      }
      if (!data.items || data.items.length === 0) {
        throw new BadRequestException('Transaction must contain at least one item');
      }

      // 2. Generate Transaction ID and Invoice Number
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      
      const lastTrx = await manager.findOne(TransactionEntity, {
        where: {},
        order: { id: 'DESC' },
      });
      let nextNum = 1;
      if (lastTrx) {
        const lastNum = parseInt(lastTrx.id.replace(/\D/g, ''), 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
      
      const trxId = `TRX${String(nextNum).padStart(3, '0')}`;
      const invoiceNumber = `INV/${year}/${month}/${String(nextNum).padStart(4, '0')}`;

      // 3. Process items and update stock
      const processedItems: TransactionItemEntity[] = [];
      let calculatedSubtotal = 0;

      const lastItem = await manager.findOne(TransactionItemEntity, {
        where: {},
        order: { id: 'DESC' },
      });
      let nextItemNum = 1;
      if (lastItem) {
        const lastNum = parseInt(lastItem.id.replace(/\D/g, ''), 10);
        if (!isNaN(lastNum)) {
          nextItemNum = lastNum + 1;
        }
      }

      for (const item of data.items) {
        // Calculate subtotal
        const itemSubtotal = (item.sell_price || 0) * (item.qty || 1);
        calculatedSubtotal += itemSubtotal;

        // Auto-decrement stock for catalog items
        if (item.product_id && item.product_type !== 'service') {
          const stockItem = await manager.findOne(StockItemEntity, {
            where: { id: item.product_id },
          });
          if (stockItem) {
            if (stockItem.stock < item.qty) {
              throw new BadRequestException(
                `Insufficient stock for item "${stockItem.brand} ${stockItem.name}". Available: ${stockItem.stock}`,
              );
            }
            // Auto decrement
            stockItem.stock -= item.qty;
            await manager.save(StockItemEntity, stockItem);
          }
        }

        const itemId = `TI${String(nextItemNum + processedItems.length).padStart(3, '0')}`;

        const trxItem = manager.create(TransactionItemEntity, {
          id: itemId,
          transaction_id: trxId,
          product_type: item.product_type,
          product_id: item.product_id,
          name: item.name,
          original_price: Number(item.original_price),
          sell_price: Number(item.sell_price),
          qty: Number(item.qty),
          subtotal: itemSubtotal,
        });
        processedItems.push(trxItem);
      }

      // Calculate final totals
      const discount = Number(data.discount || 0);
      const totalAmount = Math.max(0, calculatedSubtotal - discount);
      const paidAmount = Number(data.paid_amount || 0);
      const remainingAmount = Math.max(0, totalAmount - paidAmount);

      // Determine statuses
      let paymentStatus = data.payment_status;
      if (!paymentStatus) {
        if (paidAmount === 0) paymentStatus = 'belum_bayar';
        else if (remainingAmount === 0) paymentStatus = 'lunas';
        else paymentStatus = 'dp';
      }

      // Save Transaction
      const transaction = manager.create(TransactionEntity, {
        id: trxId,
        invoice_number: invoiceNumber,
        patient_id: data.patient_id,
        prescription_id: data.prescription_id,
        discount,
        subtotal: calculatedSubtotal,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        payment_method: data.payment_method || 'tunai',
        payment_status: paymentStatus,
        order_status: data.order_status || 'pending',
        notes: data.notes,
        created_at: date.toISOString(),
        created_by: data.created_by || 'Sistem POS',
      });

      const savedTrx = await manager.save(TransactionEntity, transaction);

      // Save items
      for (const item of processedItems) {
        item.transaction_id = savedTrx.id;
        await manager.save(TransactionItemEntity, item);
      }

      // Return fully loaded transaction
      return manager.findOne(TransactionEntity, {
        where: { id: savedTrx.id },
        relations: ['patient', 'prescription', 'items'],
      });
    });
  }

  async updateStatus(
    id: string,
    status: { order_status?: string; payment_status?: string; paid_amount?: number },
  ): Promise<TransactionEntity> {
    return this.entityManager.transaction(async (manager) => {
      const trx = await manager.findOne(TransactionEntity, {
        where: { id },
        relations: ['items'],
      });

      if (!trx) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }

      // Handle Cancellation (Restore Stock)
      if (status.order_status && status.order_status !== trx.order_status) {
        const oldStatus = trx.order_status;
        trx.order_status = status.order_status as any;

        // If changing to 'dibatalkan', restore stock
        if (status.order_status === 'dibatalkan' && oldStatus !== 'dibatalkan') {
          for (const item of trx.items) {
            if (item.product_id && item.product_type !== 'service') {
              const stockItem = await manager.findOne(StockItemEntity, { 
                where: { id: item.product_id },
              });
              if (stockItem) {
                stockItem.stock += item.qty;
                await manager.save(StockItemEntity, stockItem);
              }
            }
          }
        }
        
        // If changing from 'dibatalkan' back to active, we should theoretically re-deduct stock.
        // For simplicity, we assume 'dibatalkan' is a final state, or we handle deduction if needed.
        if (oldStatus === 'dibatalkan' && status.order_status !== 'dibatalkan') {
          for (const item of trx.items) {
            if (item.product_id && item.product_type !== 'service') {
              const stockItem = await manager.findOne(StockItemEntity, { 
                where: { id: item.product_id },
              });
              if (stockItem) {
                if (stockItem.stock < item.qty) {
                  throw new BadRequestException(`Insufficient stock to un-cancel. Item "${stockItem.brand} ${stockItem.name}" only has ${stockItem.stock} left.`);
                }
                stockItem.stock -= item.qty;
                await manager.save(StockItemEntity, stockItem);
              }
            }
          }
        }
      }

      if (status.paid_amount !== undefined) {
        trx.paid_amount = Math.min(trx.total_amount, trx.paid_amount + status.paid_amount);
        trx.remaining_amount = Math.max(0, trx.total_amount - trx.paid_amount);

        if (trx.remaining_amount === 0) {
          trx.payment_status = 'lunas';
        } else {
          trx.payment_status = 'dp';
        }
      }

      if (status.payment_status) {
        trx.payment_status = status.payment_status as any;
        if (trx.payment_status === 'lunas') {
          trx.paid_amount = trx.total_amount;
          trx.remaining_amount = 0;
        }
      }

      return manager.save(TransactionEntity, trx);
    });
  }

  async remove(id: string): Promise<void> {
    await this.entityManager.transaction(async (manager) => {
      const trx = await manager.findOne(TransactionEntity, {
        where: { id },
        relations: ['items'],
      });
      if (!trx) throw new NotFoundException(`Transaction with ID ${id} not found`);

      // Restore stock if it wasn't already cancelled
      if (trx.order_status !== 'dibatalkan') {
        for (const item of trx.items) {
          if (item.product_id && item.product_type !== 'service') {
            const stockItem = await manager.findOne(StockItemEntity, { 
              where: { id: item.product_id },
            });
            if (stockItem) {
              stockItem.stock += item.qty;
              await manager.save(StockItemEntity, stockItem);
            }
          }
        }
      }

      await manager.remove(TransactionEntity, trx);
    });
  }
}
