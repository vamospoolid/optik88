import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientEntity } from '../entities/patient.entity';
import { EyeExaminationEntity } from '../entities/examination.entity';
import { PrescriptionEntity } from '../entities/prescription.entity';
import { PrescriptionDetailEntity } from '../entities/prescription-detail.entity';
import { StockItemEntity } from '../entities/stock.entity';
import { TransactionEntity } from '../entities/transaction.entity';
import { TransactionItemEntity } from '../entities/transaction-item.entity';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    @InjectRepository(PatientEntity)
    private readonly patientRepo: Repository<PatientEntity>,
    @InjectRepository(EyeExaminationEntity)
    private readonly examRepo: Repository<EyeExaminationEntity>,
    @InjectRepository(PrescriptionEntity)
    private readonly prescriptionRepo: Repository<PrescriptionEntity>,
    @InjectRepository(PrescriptionDetailEntity)
    private readonly prescriptionDetailRepo: Repository<PrescriptionDetailEntity>,
    @InjectRepository(StockItemEntity)
    private readonly stockRepo: Repository<StockItemEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
    @InjectRepository(TransactionItemEntity)
    private readonly transactionItemRepo: Repository<TransactionItemEntity>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    // Check if database is already seeded
    const patientCount = await this.patientRepo.count();
    if (patientCount > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    console.log('🌱 Seeding initial demo data into SQLite database...');

    // 1. Seed Patients
    const patients = [
      {
        id: 'P001',
        name: 'Budi Santoso',
        phone: '081234567890',
        nik: '3201234567890001',
        gender: 'male' as const,
        birth_date: '1985-04-12',
        address: 'Jl. Merdeka No. 45, Jakarta',
        bpjs_number: '0001234567890',
      },
      {
        id: 'P002',
        name: 'Siti Aminah',
        phone: '089876543210',
        nik: '3201234567890002',
        gender: 'female' as const,
        birth_date: '1992-08-25',
        address: 'Jl. Sudirman No. 10, Bandung',
      },
      {
        id: 'P003',
        name: 'Andi Wijaya',
        phone: '081122334455',
        nik: '3201234567890003',
        gender: 'male' as const,
        birth_date: '1978-11-05',
      },
    ];
    await this.patientRepo.save(patients);

    // 2. Seed Eye Examinations & Prescriptions
    const exams = [
      {
        id: 'E001',
        patient_id: 'P001',
        source: 'external' as const,
        external_source_type: 'bpjs' as const,
        facility_name: 'RSUD Kota',
        doctor_name: 'Dr. Anwar, Sp.M',
        exam_date: '2023-10-10',
        notes: 'Pasien mengeluh pandangan kabur saat membaca',
      },
      {
        id: 'E002',
        patient_id: 'P001',
        source: 'internal' as const,
        exam_date: '2023-10-12',
        notes: 'Pemeriksaan optik untuk komparasi',
      },
    ];
    await this.examRepo.save(exams);

    // Seed Prescriptions
    const prescriptions = [
      {
        id: 'PR001',
        examination_id: 'E001',
        type: 'progressive' as const,
        pd: 64,
      },
      {
        id: 'PR002',
        examination_id: 'E002',
        type: 'progressive' as const,
        pd: 64,
      },
    ];
    await this.prescriptionRepo.save(prescriptions);

    // Seed Prescription Details
    const rxDetails = [
      { prescription_id: 'PR001', eye: 'R' as const, sph: -1.5, cyl: -0.5, axis: 90, add_power: 2.0 },
      { prescription_id: 'PR001', eye: 'L' as const, sph: -1.75, cyl: -0.25, axis: 85, add_power: 2.0 },
      { prescription_id: 'PR002', eye: 'R' as const, sph: -1.5, cyl: -0.5, axis: 90, add_power: 2.25 },
      { prescription_id: 'PR002', eye: 'L' as const, sph: -1.75, cyl: -0.25, axis: 85, add_power: 2.25 },
    ];
    await this.prescriptionDetailRepo.save(rxDetails);

    // 3. Seed Stock Items
    const stockItems = [
      // Frames
      { id: 'F001', category: 'frame' as const, brand: 'Ray-Ban', name: 'RB5154 Clubmaster', sku: 'RB5154-BK', color: 'Hitam', modal_price: 450000, sell_price: 750000, stock: 5, min_stock: 2, supplier: 'Optik Internasional' },
      { id: 'F002', category: 'frame' as const, brand: 'Oakley', name: 'OX8046 Crosslink', sku: 'OX8046-GR', color: 'Abu-abu', modal_price: 550000, sell_price: 950000, stock: 3, min_stock: 2, supplier: 'Optik Internasional' },
      { id: 'F003', category: 'frame' as const, brand: 'Gucci', name: 'GG0396O', sku: 'GG0396-GD', color: 'Gold', modal_price: 1200000, sell_price: 2200000, stock: 2, min_stock: 1, supplier: 'Luxe Optik' },
      { id: 'F004', category: 'frame' as const, brand: 'Lokal Premium', name: 'Titanium Rimless', sku: 'LK-TI001', color: 'Silver', modal_price: 180000, sell_price: 350000, stock: 8, min_stock: 3, supplier: 'Toko Grosir Frame' },
      { id: 'F005', category: 'frame' as const, brand: 'Lokal', name: 'Full Rim Plastik', sku: 'LK-PL002', color: 'Biru', modal_price: 60000, sell_price: 150000, stock: 15, min_stock: 5, supplier: 'Toko Grosir Frame' },
      // Lenses
      { id: 'L001', category: 'lens' as const, brand: 'Essilor', name: 'Crizal Avance UV', sku: 'ESS-CAV-15', modal_price: 800000, sell_price: 1500000, stock: 20, min_stock: 5, description: 'Index 1.5, Anti-reflective, UV400' },
      { id: 'L002', category: 'lens' as const, brand: 'Hoya', name: 'Summit Pro', sku: 'HOY-SP-16', modal_price: 600000, sell_price: 1100000, stock: 15, min_stock: 5, description: 'Index 1.6, Progressive' },
      { id: 'L003', category: 'lens' as const, brand: 'Essilor', name: 'Transitions Gen 8', sku: 'ESS-TR8-15', modal_price: 950000, sell_price: 1800000, stock: 10, min_stock: 3, description: 'Photochromic, Index 1.5' },
      { id: 'L004', category: 'lens' as const, brand: 'Lokal', name: 'Blue-Cut MC', sku: 'LK-BC-15', modal_price: 120000, sell_price: 280000, stock: 30, min_stock: 10, description: 'Anti Blue Light, Index 1.5' },
      // Services
      { id: 'S001', category: 'service' as const, brand: '-', name: 'Jasa Pasang Lensa', sku: 'SVC-001', modal_price: 0, sell_price: 50000, stock: 999, min_stock: 0 },
      { id: 'S002', category: 'service' as const, brand: '-', name: 'Jasa Periksa Mata', sku: 'SVC-002', modal_price: 0, sell_price: 30000, stock: 999, min_stock: 0 },
      { id: 'S003', category: 'service' as const, brand: '-', name: 'Jasa Ganti Lensa', sku: 'SVC-003', modal_price: 0, sell_price: 75000, stock: 999, min_stock: 0 },
    ];
    await this.stockRepo.save(stockItems);

    // 4. Seed Transactions
    const transactions = [
      {
        id: 'TRX001',
        invoice_number: 'INV/2024/01/0001',
        patient_id: 'P001',
        prescription_id: 'PR001',
        discount: 100000,
        subtotal: 2200000,
        total_amount: 2100000,
        paid_amount: 1000000,
        remaining_amount: 1100000,
        payment_method: 'transfer' as const,
        payment_status: 'dp' as const,
        order_status: 'diproses' as const,
        notes: 'Frame sudah siap, menunggu lensa datang',
        created_at: '2024-01-15T10:30:00',
        created_by: 'Admin Optik',
      },
      {
        id: 'TRX002',
        invoice_number: 'INV/2024/01/0002',
        patient_id: 'P002',
        discount: 0,
        subtotal: 600000,
        total_amount: 600000,
        paid_amount: 600000,
        remaining_amount: 0,
        payment_method: 'tunai' as const,
        payment_status: 'lunas' as const,
        order_status: 'selesai' as const,
        created_at: '2024-01-14T14:00:00',
        created_by: 'Kasir Depan',
      },
    ];
    await this.transactionRepo.save(transactions);

    // Seed Transaction Items
    const transactionItems = [
      { id: 'TI001', transaction_id: 'TRX001', product_type: 'frame' as const, product_id: 'F001', name: 'Ray-Ban RB5154 Clubmaster (Hitam)', original_price: 750000, sell_price: 750000, qty: 1, subtotal: 750000 },
      { id: 'TI002', transaction_id: 'TRX001', product_type: 'lens' as const, product_id: 'L001', name: 'Essilor Crizal Avance UV', original_price: 1500000, sell_price: 1400000, qty: 1, subtotal: 1400000 },
      { id: 'TI003', transaction_id: 'TRX001', product_type: 'service' as const, product_id: 'S001', name: 'Jasa Pasang Lensa', original_price: 50000, sell_price: 50000, qty: 1, subtotal: 50000 },
      { id: 'TI004', transaction_id: 'TRX002', product_type: 'frame' as const, product_id: 'F004', name: 'Titanium Rimless (Silver)', original_price: 350000, sell_price: 320000, qty: 1, subtotal: 320000 },
      { id: 'TI005', transaction_id: 'TRX002', product_type: 'lens' as const, product_id: 'L004', name: 'Lokal Blue-Cut MC', original_price: 280000, sell_price: 280000, qty: 1, subtotal: 280000 },
    ];
    await this.transactionItemRepo.save(transactionItems);

    console.log('✅ SQLite seeding completed with 3 Patients, 2 Exams, 12 Stock SKUs, and 2 Transactions.');
  }
}
