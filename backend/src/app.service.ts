import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to Optik88 POS & Inventory Management System API!';
  }
}
