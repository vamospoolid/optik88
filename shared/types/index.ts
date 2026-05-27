export type Patient = {
  id: string;
  name: string;
  phone?: string;
  nik?: string;
  gender?: 'male' | 'female';
  birth_date?: string;
  address?: string;
  bpjs_number?: string;
  created_at?: string;
};

export type EyeExamination = {
  id: string;
  patient_id: string;
  source: 'external' | 'internal';
  external_source_type?: 'bpjs' | 'klinik' | 'dokter_praktek' | 'rumah_sakit' | 'lainnya';
  doctor_name?: string;
  facility_name?: string;
  reference_number?: string;
  exam_date: string;
  notes?: string;
};

export type PrescriptionDetail = {
  eye: 'R' | 'L';
  sph: number;
  cyl?: number;
  axis?: number;
  add_power?: number;
};

export type Prescription = {
  id: string;
  examination_id: string;
  type: 'monofocal' | 'bifocal' | 'progressive';
  pd?: number;
  details: PrescriptionDetail[];
};

export type StockItem = {
  id: string;
  category: 'frame' | 'lens' | 'service';
  brand: string;
  name: string;
  sku?: string;
  color?: string;
  modal_price: number;
  sell_price: number;
  stock: number;
  min_stock: number;
  supplier?: string;
  description?: string;
};

export type PaymentMethod = 'tunai' | 'transfer' | 'debit' | 'kredit' | 'bpjs';
export type OrderStatus = 'pending' | 'diproses' | 'siap' | 'selesai' | 'dibatalkan';
export type PaymentStatus = 'belum_bayar' | 'dp' | 'lunas';

export type TransactionItem = {
  id: string;
  product_type: 'frame' | 'lens' | 'service';
  product_id?: string;
  name: string;
  original_price: number;
  sell_price: number; // Can be custom
  qty: number;
  subtotal: number;
};

export type Transaction = {
  id: string;
  invoice_number: string;
  patient_id: string;
  prescription_id?: string;
  items: TransactionItem[];
  discount: number;
  subtotal: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  notes?: string;
  created_at: string;
  created_by: string;
};

export type CashflowType = 'INCOME' | 'EXPENSE';

export type Cashflow = {
  id: string;
  type: CashflowType;
  amount: number;
  category: string;
  notes?: string;
  created_at: string;
  created_by: string;
};

export type CashflowSummary = {
  total_auto_income: number;
  total_manual_income: number;
  total_expense: number;
  net_balance: number;
};
