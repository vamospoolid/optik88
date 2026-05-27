import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PatientEntity } from '../../entities/patient.entity';

@ApiTags('Patients')
@Controller('api/patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all registered patients' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all patients.', type: [PatientEntity] })
  async findAll(): Promise<PatientEntity[]> {
    return this.patientsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient by ID' })
  @ApiParam({ name: 'id', description: 'Patient unique ID (e.g. P001)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return patient details.', type: PatientEntity })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Patient not found.' })
  async findOne(@Param('id') id: string): Promise<PatientEntity> {
    return this.patientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new patient' })
  @ApiBody({
    description: 'Patient payload',
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'string', example: 'P004' },
        name: { type: 'string', example: 'Dewi Lestari' },
        phone: { type: 'string', example: '081299998888' },
        nik: { type: 'string', example: '3201234567890004' },
        gender: { type: 'string', enum: ['male', 'female'], example: 'female' },
        birth_date: { type: 'string', example: '1995-10-15' },
        address: { type: 'string', example: 'Jl. Melati No. 8, Depok' },
        bpjs_number: { type: 'string', example: '0001234567899' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Patient registered successfully.', type: PatientEntity })
  async create(@Body() data: any): Promise<PatientEntity> {
    return this.patientsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update patient information' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Patient updated successfully.', type: PatientEntity })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Patient not found.' })
  async update(@Param('id') id: string, @Body() data: any): Promise<PatientEntity> {
    return this.patientsService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete patient record' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Patient deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Patient not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.patientsService.remove(id);
  }
}
