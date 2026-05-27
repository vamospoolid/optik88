import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ExaminationsService } from './examinations.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { EyeExaminationEntity } from '../../entities/examination.entity';

@ApiTags('Examinations')
@Controller('api/examinations')
export class ExaminationsController {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all eye examinations' })
  @ApiQuery({ name: 'patient_id', required: false, description: 'Filter exams by Patient ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return clinical exam list.', type: [EyeExaminationEntity] })
  async findAll(@Query('patient_id') patientId?: string): Promise<EyeExaminationEntity[]> {
    if (patientId) {
      return this.examinationsService.findByPatient(patientId);
    }
    return this.examinationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific examination record by ID' })
  @ApiParam({ name: 'id', description: 'Exam ID (e.g. E001)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return examination and prescription details.', type: EyeExaminationEntity })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Record not found.' })
  async findOne(@Param('id') id: string): Promise<EyeExaminationEntity> {
    return this.examinationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new eye examination with prescription details' })
  @ApiBody({
    description: 'Refraction exam payload',
    schema: {
      type: 'object',
      required: ['exam', 'prescription'],
      properties: {
        exam: {
          type: 'object',
          required: ['patient_id', 'source', 'exam_date'],
          properties: {
            patient_id: { type: 'string', example: 'P001' },
            source: { type: 'string', enum: ['internal', 'external'], example: 'internal' },
            exam_date: { type: 'string', example: '2026-05-26' },
            notes: { type: 'string', example: 'Ganti kacamata karena resep lama sudah tidak cocok.' },
          },
        },
        prescription: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: ['monofocal', 'bifocal', 'progressive'], example: 'progressive' },
            pd: { type: 'integer', example: 64 },
            details: {
              type: 'array',
              items: {
                type: 'object',
                required: ['eye', 'sph'],
                properties: {
                  eye: { type: 'string', enum: ['R', 'L'], example: 'R' },
                  sph: { type: 'number', example: -1.75 },
                  cyl: { type: 'number', example: -0.5 },
                  axis: { type: 'integer', example: 90 },
                  add_power: { type: 'number', example: 2.25 },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Clinical exam saved successfully.' })
  async create(@Body() data: any) {
    return this.examinationsService.create(data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete clinical record' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Clinical record deleted.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.examinationsService.remove(id);
  }
}
