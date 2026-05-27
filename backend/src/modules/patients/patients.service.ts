import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientEntity } from '../../entities/patient.entity';
import { Patient as IPatient } from 'optik88-shared';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(PatientEntity)
    private readonly patientRepo: Repository<PatientEntity>,
  ) {}

  async findAll(): Promise<PatientEntity[]> {
    return this.patientRepo.find({
      relations: ['examinations', 'transactions'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PatientEntity> {
    const patient = await this.patientRepo.findOne({
      where: { id },
      relations: ['examinations', 'examinations.prescription', 'transactions'],
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }
    return patient;
  }

  async create(data: Partial<IPatient>): Promise<PatientEntity> {
    // Auto generate ID if not provided, e.g., P004
    if (!data.id) {
      const count = await this.patientRepo.count();
      data.id = `P${String(count + 1).padStart(3, '0')}`;
    }
    const patient = this.patientRepo.create(data);
    return this.patientRepo.save(patient);
  }

  async update(id: string, data: Partial<IPatient>): Promise<PatientEntity> {
    const patient = await this.findOne(id);
    Object.assign(patient, data);
    return this.patientRepo.save(patient);
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    await this.patientRepo.remove(patient);
  }
}
