import { Controller, Get, Post, Body, Param, Put, Delete, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { StockService } from './stock.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { StockItemEntity } from '../../entities/stock.entity';

@ApiTags('Stock / Inventory')
@Controller('api/stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: 'Get all stock items' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return complete stock catalog.', type: [StockItemEntity] })
  async findAll(): Promise<StockItemEntity[]> {
    return this.stockService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific stock item by ID' })
  @ApiParam({ name: 'id', description: 'Item ID (e.g. F001)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return item details.', type: StockItemEntity })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Item not found.' })
  async findOne(@Param('id') id: string): Promise<StockItemEntity> {
    return this.stockService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new stock item' })
  @ApiBody({
    description: 'Stock item payload',
    schema: {
      type: 'object',
      required: ['category', 'brand', 'name', 'modal_price', 'sell_price', 'stock', 'min_stock'],
      properties: {
        id: { type: 'string', example: 'F006' },
        category: { type: 'string', enum: ['frame', 'lens', 'service'], example: 'frame' },
        brand: { type: 'string', example: 'Ray-Ban' },
        name: { type: 'string', example: 'RB5154 Aviator' },
        sku: { type: 'string', example: 'RB5154-AV' },
        color: { type: 'string', example: 'Gold' },
        modal_price: { type: 'integer', example: 500000 },
        sell_price: { type: 'integer', example: 850000 },
        stock: { type: 'integer', example: 10 },
        min_stock: { type: 'integer', example: 3 },
        supplier: { type: 'string', example: 'Optik Global' },
        description: { type: 'string', example: 'Ray-Ban premium retro gold collection.' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Stock item created successfully.', type: StockItemEntity })
  async create(@Body() data: any): Promise<StockItemEntity> {
    return this.stockService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update stock item catalog details' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item updated successfully.', type: StockItemEntity })
  async update(@Param('id') id: string, @Body() data: any): Promise<StockItemEntity> {
    return this.stockService.update(id, data);
  }

  @Patch(':id/adjust')
  @ApiOperation({ summary: 'Adjust stock quantity (opname/correction)' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['adjustment'],
      properties: {
        adjustment: { type: 'integer', description: 'Add/subtract amount (e.g. +5 or -2)', example: 5 },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Stock quantity adjusted successfully.', type: StockItemEntity })
  async adjustStock(@Param('id') id: string, @Body('adjustment') adjustment: number): Promise<StockItemEntity> {
    return this.stockService.adjustStock(id, adjustment);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a stock item' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Item deleted.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.stockService.remove(id);
  }
}
