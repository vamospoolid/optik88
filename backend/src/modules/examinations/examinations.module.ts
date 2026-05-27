import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExaminationsController } from './examinations.controller';
import { ExaminationsService } from './examinations.service';
import { EyeExaminationEntity } from '../../entities/examination.entity';
import { PrescriptionEntity } from '../../entities/prescription.entity';
import { PrescriptionDetailEntity } from '../../entities/prescription-detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EyeExaminationEntity,
      PrescriptionEntity,
      PrescriptionDetailEntity,
    ]),
  ],
  controllers: [ExaminationsController],
  providers: [ExaminationsService],
  exports: [ExaminationsService],
})
export class ExaminationsModule {}
