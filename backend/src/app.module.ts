import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SeederService } from './database/seeder.service';
import { PatientEntity } from './entities/patient.entity';
import { EyeExaminationEntity } from './entities/examination.entity';
import { PrescriptionEntity } from './entities/prescription.entity';
import { PrescriptionDetailEntity } from './entities/prescription-detail.entity';
import { StockItemEntity } from './entities/stock.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { TransactionItemEntity } from './entities/transaction-item.entity';
import { CashflowEntity } from './entities/cashflow.entity';

// Feature Modules
import { PatientsModule } from './modules/patients/patients.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { StockModule } from './modules/stock/stock.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { AuthModule } from './modules/auth/auth.module';
import { CashflowModule } from './modules/cashflow/cashflow.module';
import { BackupModule } from './modules/backup/backup.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [
        PatientEntity,
        EyeExaminationEntity,
        PrescriptionEntity,
        PrescriptionDetailEntity,
        StockItemEntity,
        TransactionEntity,
        TransactionItemEntity,
        CashflowEntity,
      ],
      synchronize: true, // Auto create/update schema in SQLite dev environment
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      PatientEntity,
      EyeExaminationEntity,
      PrescriptionEntity,
      PrescriptionDetailEntity,
      StockItemEntity,
      TransactionEntity,
      TransactionItemEntity,
      CashflowEntity,
    ]),
    PatientsModule,
    ExaminationsModule,
    StockModule,
    TransactionsModule,
    AuthModule,
    CashflowModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeederService],
})
export class AppModule {}

