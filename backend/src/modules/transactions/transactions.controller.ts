import { Controller, Get, Post, Body, Param, Put, Delete, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { TransactionEntity } from '../../entities/transaction.entity';

@ApiTags('Transactions & POS Checkout')
@Controller('api/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all sales transactions' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return complete transaction list.', type: [TransactionEntity] })
  async findAll(): Promise<TransactionEntity[]> {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID (e.g. TRX001)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return transaction details.', type: TransactionEntity })
  async findOne(@Param('id') id: string): Promise<TransactionEntity> {
    return this.transactionsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Checkout a new transaction' })
  @ApiBody({
    description: 'Transaction cart payload',
    schema: {
      type: 'object',
      required: ['patient_id', 'items', 'paid_amount', 'payment_method'],
      properties: {
        patient_id: { type: 'string', example: 'P001' },
        prescription_id: { type: 'string', example: 'PR001' },
        discount: { type: 'integer', example: 50000 },
        paid_amount: { type: 'integer', example: 1000000 },
        payment_method: { type: 'string', enum: ['tunai', 'transfer', 'debit', 'kredit', 'bpjs'], example: 'transfer' },
        notes: { type: 'string', example: 'Pasien meminta lensa dengan anti-radiasi biru.' },
        created_by: { type: 'string', example: 'Admin Kasir' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['product_type', 'name', 'original_price', 'sell_price', 'qty'],
            properties: {
              product_type: { type: 'string', enum: ['frame', 'lens', 'service'], example: 'frame' },
              product_id: { type: 'string', example: 'F001' },
              name: { type: 'string', example: 'Ray-Ban RB5154 Clubmaster (Hitam)' },
              original_price: { type: 'integer', example: 750000 },
              sell_price: { type: 'integer', example: 750000 },
              qty: { type: 'integer', example: 1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Transaction created and stock auto-decremented successfully.', type: TransactionEntity })
  async create(@Body() data: any): Promise<TransactionEntity> {
    return this.transactionsService.create(data);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update transaction order or payment status' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        order_status: { type: 'string', enum: ['pending', 'diproses', 'siap', 'selesai', 'dibatalkan'], example: 'siap' },
        payment_status: { type: 'string', enum: ['belum_bayar', 'dp', 'lunas'], example: 'lunas' },
        paid_amount: { type: 'integer', description: 'Additional payment amount (increases paid_amount, recalculates remaining)', example: 500000 },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transaction status updated successfully.', type: TransactionEntity })
  async updateStatus(
    @Param('id') id: string,
    @Body() status: { order_status?: string; payment_status?: string; paid_amount?: number },
  ): Promise<TransactionEntity> {
    return this.transactionsService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete transaction record' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Transaction deleted.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.transactionsService.remove(id);
  }
}
