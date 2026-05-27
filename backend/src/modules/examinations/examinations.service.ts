import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { EyeExaminationEntity } from '../../entities/examination.entity';
import { PrescriptionEntity } from '../../entities/prescription.entity';
import { PrescriptionDetailEntity } from '../../entities/prescription-detail.entity';
import { EyeExamination as IEyeExamination, Prescription as IPrescription } from 'optik88-shared';

@Injectable()
export class ExaminationsService {
  constructor(
    @InjectRepository(EyeExaminationEntity)
    private readonly examRepo: Repository<EyeExaminationEntity>,
    @InjectRepository(PrescriptionEntity)
    private readonly prescriptionRepo: Repository<PrescriptionEntity>,
    private readonly entityManager: EntityManager,
  ) {}

  async findAll(): Promise<EyeExaminationEntity[]> {
    return this.examRepo.find({
      relations: ['patient', 'prescription', 'prescription.details'],
      order: { exam_date: 'DESC' },
    });
  }

  async findByPatient(patientId: string): Promise<EyeExaminationEntity[]> {
    return this.examRepo.find({
      where: { patient_id: patientId },
      relations: ['prescription', 'prescription.details'],
      order: { exam_date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<EyeExaminationEntity> {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['patient', 'prescription', 'prescription.details'],
    });
    if (!exam) {
      throw new NotFoundException(`Examination record with ID ${id} not found`);
    }
    return exam;
  }

  async create(data: {
    exam: Partial<IEyeExamination>;
    prescription: Partial<IPrescription>;
  }): Promise<{ exam: EyeExaminationEntity; prescription: PrescriptionEntity }> {
    return this.entityManager.transaction(async (manager) => {
      // 1. Save Eye Examination
      const examData = data.exam;
      if (!examData.id) {
        const lastExam = await manager.findOne(EyeExaminationEntity, {
          where: {},
          order: { id: 'DESC' },
        });
        let nextExamNum = 1;
        if (lastExam) {
          const lastNum = parseInt(lastExam.id.replace(/\D/g, ''), 10);
          if (!isNaN(lastNum)) {
            nextExamNum = lastNum + 1;
          }
        }
        examData.id = `E${String(nextExamNum).padStart(3, '0')}`;
      }
      const exam = manager.create(EyeExaminationEntity, examData);
      const savedExam = await manager.save(EyeExaminationEntity, exam);

      // 2. Save Prescription (if provided)
      let savedPrescription: PrescriptionEntity = null;
      if (data.prescription) {
        const prescriptionData = data.prescription;
        if (!prescriptionData.id) {
          const lastRx = await manager.findOne(PrescriptionEntity, {
            where: {},
            order: { id: 'DESC' },
          });
          let nextRxNum = 1;
          if (lastRx) {
            const lastNum = parseInt(lastRx.id.replace(/\D/g, ''), 10);
            if (!isNaN(lastNum)) {
              nextRxNum = lastNum + 1;
            }
          }
          prescriptionData.id = `PR${String(nextRxNum).padStart(3, '0')}`;
        }
        prescriptionData.examination_id = savedExam.id;

        // Create main prescription record
        const prescription = manager.create(PrescriptionEntity, {
          id: prescriptionData.id,
          examination_id: prescriptionData.examination_id,
          type: prescriptionData.type,
          pd: prescriptionData.pd,
        });
        savedPrescription = await manager.save(PrescriptionEntity, prescription);

        // Save Prescription Details
        if (prescriptionData.details && prescriptionData.details.length > 0) {
          const details = prescriptionData.details.map((d) =>
            manager.create(PrescriptionDetailEntity, {
              prescription_id: savedPrescription.id,
              eye: d.eye,
              sph: Number(d.sph),
              cyl: d.cyl ? Number(d.cyl) : undefined,
              axis: d.axis ? Number(d.axis) : undefined,
              add_power: d.add_power ? Number(d.add_power) : undefined,
            }),
          );
          await manager.save(PrescriptionDetailEntity, details);
        }
      }

      // Reload prescription to include the details
      const reloadedRx = savedPrescription
        ? await manager.findOne(PrescriptionEntity, {
            where: { id: savedPrescription.id },
            relations: ['details'],
          })
        : null;

      return { exam: savedExam, prescription: reloadedRx };
    });
  }

  async remove(id: string): Promise<void> {
    const exam = await this.findOne(id);
    await this.examRepo.remove(exam);
  }
}
