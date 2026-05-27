import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { CashflowService } from './cashflow.service';
import { Cashflow } from 'optik88-shared';

@Controller('api/cashflow')
export class CashflowController {
  constructor(private readonly cashflowService: CashflowService) {}

  @Post()
  create(@Body() data: Partial<Cashflow>) {
    return this.cashflowService.create(data);
  }

  @Get()
  getAll(@Query('period') period?: string) {
    return this.cashflowService.getAll(period);
  }

  @Get('summary/today')
  getTodaySummary() {
    return this.cashflowService.getTodaySummary();
  }

  @Get('records/today')
  getTodayRecords() {
    return this.cashflowService.getTodayRecords();
  }
}

