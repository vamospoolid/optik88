export type Patient = {
  id: string
  name: string
  phone?: string
  nik?: string
  gender?: "male" | "female"
  birth_date?: string
  address?: string
  bpjs_number?: string
  created_at?: string
}

export type EyeExamination = {
  id: string
  patient_id: string
  source: "external" | "internal"
  external_source_type?: "bpjs" | "klinik" | "dokter_praktek" | "rumah_sakit" | "lainnya"
  doctor_name?: string
  facility_name?: string
  reference_number?: string
  exam_date: string
  notes?: string
}

export type PrescriptionDetail = {
  eye: "R" | "L"
  sph: number
  cyl?: number
  axis?: number
  add_power?: number
}

export type Prescription = {
  id: string
  examination_id: string
  type: "monofocal" | "bifocal" | "progressive"
  pd?: number
  details: PrescriptionDetail[]
}

export const seedPatients: Patient[] = [
  {
    id: "P001",
    name: "Budi Santoso",
    phone: "081234567890",
    nik: "3201234567890001",
    gender: "male",
    birth_date: "1985-04-12",
    address: "Jl. Merdeka No. 45, Jakarta",
    bpjs_number: "0001234567890"
  },
  {
    id: "P002",
    name: "Siti Aminah",
    phone: "089876543210",
    gender: "female",
    birth_date: "1992-08-25",
    address: "Jl. Sudirman No. 10, Bandung"
  },
  {
    id: "P003",
    name: "Andi Wijaya",
    phone: "081122334455",
    gender: "male",
    birth_date: "1978-11-05",
  }
];

export const seedExaminations: EyeExamination[] = [
  {
    id: "E001",
    patient_id: "P001",
    source: "external",
    external_source_type: "bpjs",
    facility_name: "RSUD Kota",
    doctor_name: "Dr. Anwar, Sp.M",
    exam_date: "2023-10-10",
    notes: "Pasien mengeluh pandangan kabur saat membaca"
  },
  {
    id: "E002",
    patient_id: "P001",
    source: "internal",
    exam_date: "2023-10-12",
    notes: "Pemeriksaan optik untuk komparasi"
  }
];

export const seedPrescriptions: Prescription[] = [
  {
    id: "PR001",
    examination_id: "E001",
    type: "progressive",
    pd: 64,
    details: [
      { eye: "R", sph: -1.50, cyl: -0.50, axis: 90, add_power: 2.00 },
      { eye: "L", sph: -1.75, cyl: -0.25, axis: 85, add_power: 2.00 }
    ]
  },
  {
    id: "PR002",
    examination_id: "E002",
    type: "progressive",
    pd: 64,
    details: [
      { eye: "R", sph: -1.50, cyl: -0.50, axis: 90, add_power: 2.25 }, // Slightly different add
      { eye: "L", sph: -1.75, cyl: -0.25, axis: 85, add_power: 2.25 }
    ]
  }
];

export const seedDashboardStats = {
  todayPatients: 12,
  todayExams: 8,
  todayRevenue: 2450000,
  lowStockItems: 3
};

// ============================================================
// STOCK TYPES
// ============================================================
export type StockItem = {
  id: string
  category: 'frame' | 'lens' | 'service'
  brand: string
  name: string
  sku?: string
  color?: string
  modal_price: number
  sell_price: number
  stock: number
  min_stock: number
  supplier?: string
  description?: string
}

export const seedStockItems: StockItem[] = [
  // Frames
  { id: 'F001', category: 'frame', brand: 'Ray-Ban', name: 'RB5154 Clubmaster', sku: 'RB5154-BK', color: 'Hitam', modal_price: 450000, sell_price: 750000, stock: 5, min_stock: 2, supplier: 'Optik Internasional' },
  { id: 'F002', category: 'frame', brand: 'Oakley', name: 'OX8046 Crosslink', sku: 'OX8046-GR', color: 'Abu-abu', modal_price: 550000, sell_price: 950000, stock: 3, min_stock: 2, supplier: 'Optik Internasional' },
  { id: 'F003', category: 'frame', brand: 'Gucci', name: 'GG0396O', sku: 'GG0396-GD', color: 'Gold', modal_price: 1200000, sell_price: 2200000, stock: 2, min_stock: 1, supplier: 'Luxe Optik' },
  { id: 'F004', category: 'frame', brand: 'Lokal Premium', name: 'Titanium Rimless', sku: 'LK-TI001', color: 'Silver', modal_price: 180000, sell_price: 350000, stock: 8, min_stock: 3, supplier: 'Toko Grosir Frame' },
  { id: 'F005', category: 'frame', brand: 'Lokal', name: 'Full Rim Plastik', sku: 'LK-PL002', color: 'Biru', modal_price: 60000, sell_price: 150000, stock: 15, min_stock: 5, supplier: 'Toko Grosir Frame' },
  // Lenses
  { id: 'L001', category: 'lens', brand: 'Essilor', name: 'Crizal Avance UV', sku: 'ESS-CAV-15', modal_price: 800000, sell_price: 1500000, stock: 20, min_stock: 5, description: 'Index 1.5, Anti-reflective, UV400' },
  { id: 'L002', category: 'lens', brand: 'Hoya', name: 'Summit Pro', sku: 'HOY-SP-16', modal_price: 600000, sell_price: 1100000, stock: 15, min_stock: 5, description: 'Index 1.6, Progressive' },
  { id: 'L003', category: 'lens', brand: 'Essilor', name: 'Transitions Gen 8', sku: 'ESS-TR8-15', modal_price: 950000, sell_price: 1800000, stock: 10, min_stock: 3, description: 'Photochromic, Index 1.5' },
  { id: 'L004', category: 'lens', brand: 'Lokal', name: 'Blue-Cut MC', sku: 'LK-BC-15', modal_price: 120000, sell_price: 280000, stock: 30, min_stock: 10, description: 'Anti Blue Light, Index 1.5' },
  // Services
  { id: 'S001', category: 'service', brand: '-', name: 'Jasa Pasang Lensa', sku: 'SVC-001', modal_price: 0, sell_price: 50000, stock: 999, min_stock: 0 },
  { id: 'S002', category: 'service', brand: '-', name: 'Jasa Periksa Mata', sku: 'SVC-002', modal_price: 0, sell_price: 30000, stock: 999, min_stock: 0 },
  { id: 'S003', category: 'service', brand: '-', name: 'Jasa Ganti Lensa', sku: 'SVC-003', modal_price: 0, sell_price: 75000, stock: 999, min_stock: 0 },
];

// ============================================================
// TRANSACTION TYPES
// ============================================================
export type PaymentMethod = 'tunai' | 'transfer' | 'debit' | 'kredit' | 'bpjs'
export type OrderStatus = 'pending' | 'diproses' | 'siap' | 'selesai' | 'dibatalkan'
export type PaymentStatus = 'belum_bayar' | 'dp' | 'lunas'

export type TransactionItem = {
  id: string
  product_type: 'frame' | 'lens' | 'service'
  product_id?: string
  name: string
  original_price: number
  sell_price: number   // Can be custom
  qty: number
  subtotal: number
}

export type Transaction = {
  id: string
  invoice_number: string
  patient_id: string
  prescription_id?: string
  items: TransactionItem[]
  discount: number
  subtotal: number
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  order_status: OrderStatus
  notes?: string
  created_at: string
  created_by: string
}

export const seedTransactions: Transaction[] = [
  {
    id: 'TRX001',
    invoice_number: 'INV/2024/01/0001',
    patient_id: 'P001',
    prescription_id: 'PR001',
    items: [
      { id: 'TI001', product_type: 'frame', product_id: 'F001', name: 'Ray-Ban RB5154 Clubmaster (Hitam)', original_price: 750000, sell_price: 750000, qty: 1, subtotal: 750000 },
      { id: 'TI002', product_type: 'lens', product_id: 'L001', name: 'Essilor Crizal Avance UV', original_price: 1500000, sell_price: 1400000, qty: 1, subtotal: 1400000 },
      { id: 'TI003', product_type: 'service', product_id: 'S001', name: 'Jasa Pasang Lensa', original_price: 50000, sell_price: 50000, qty: 1, subtotal: 50000 },
    ],
    discount: 100000,
    subtotal: 2200000,
    total_amount: 2100000,
    paid_amount: 1000000,
    remaining_amount: 1100000,
    payment_method: 'transfer',
    payment_status: 'dp',
    order_status: 'diproses',
    notes: 'Frame sudah siap, menunggu lensa datang',
    created_at: '2024-01-15T10:30:00',
    created_by: 'Admin Optik',
  },
  {
    id: 'TRX002',
    invoice_number: 'INV/2024/01/0002',
    patient_id: 'P002',
    items: [
      { id: 'TI004', product_type: 'frame', product_id: 'F004', name: 'Titanium Rimless (Silver)', original_price: 350000, sell_price: 320000, qty: 1, subtotal: 320000 },
      { id: 'TI005', product_type: 'lens', product_id: 'L004', name: 'Lokal Blue-Cut MC', original_price: 280000, sell_price: 280000, qty: 1, subtotal: 280000 },
    ],
    discount: 0,
    subtotal: 600000,
    total_amount: 600000,
    paid_amount: 600000,
    remaining_amount: 0,
    payment_method: 'tunai',
    payment_status: 'lunas',
    order_status: 'selesai',
    created_at: '2024-01-14T14:00:00',
    created_by: 'Kasir Depan',
  }
];
