# BRD: Sistem Optik PWA/APK Berbasis Data Pasien dan Komparasi Resep

## 1. Ringkasan Dokumen

Dokumen Business Requirement Document (BRD) ini menjelaskan kebutuhan bisnis untuk pengembangan sistem optik berbasis PWA dan APK. Sistem diarahkan bukan sebagai POS detail yang kompleks, melainkan sebagai aplikasi operasional optik yang berpusat pada data pasien, riwayat pemeriksaan, komparasi resep dokter luar dengan hasil pemeriksaan optik, pengelolaan stok, dan transaksi sederhana.

Fokus utama sistem adalah membantu optik melihat perjalanan pasien secara lengkap: mulai dari identitas pasien, resep dari dokter luar seperti BPJS, klinik, rumah sakit, atau dokter praktek, hasil pemeriksaan internal optik, riwayat transaksi, status pesanan, hingga data stok barang yang digunakan dalam transaksi.

## 2. Latar Belakang

Berdasarkan hasil meeting dengan client, kebutuhan utama client bukanlah sistem POS yang sangat detail. Client lebih membutuhkan sistem yang memudahkan petugas optik untuk:

1. Melihat data pasien secara menyeluruh.
2. Membandingkan resep dari dokter luar dengan hasil pemeriksaan optik.
3. Menyimpan riwayat pemeriksaan pasien.
4. Melihat transaksi dan pembelian pasien sebelumnya.
5. Mengelola stok frame, lensa, dan jasa.
6. Membuat transaksi sederhana dengan harga dan jumlah barang yang bisa disesuaikan.

Oleh karena itu, arah produk perlu digeser dari POS-heavy system menjadi patient-centered optical management system.

## 3. Tujuan Bisnis

Tujuan bisnis sistem ini adalah:

1. Meningkatkan kualitas layanan optik dengan menyediakan data pasien yang lengkap dan mudah diakses.
2. Mempermudah optik dalam membandingkan resep dokter luar dengan hasil pemeriksaan optik.
3. Mengurangi kesalahan pencatatan resep dan transaksi.
4. Mempercepat proses pelayanan pasien dari pemeriksaan sampai transaksi.
5. Membantu optik menjaga histori pasien untuk kunjungan berikutnya.
6. Menyediakan sistem stok yang cukup praktis untuk kebutuhan operasional harian.
7. Menyediakan aplikasi yang bisa digunakan melalui browser, PWA, dan APK.

## 4. Sasaran Produk

Produk yang akan dikembangkan adalah aplikasi optik berbasis web/PWA yang dapat dibungkus menjadi APK. Sistem ini akan digunakan oleh petugas optik untuk melakukan pendataan pasien, pencatatan resep, pemeriksaan optik, transaksi sederhana, dan pengelolaan stok.

Sistem harus dapat berjalan pada:

1. Desktop/laptop untuk operasional toko.
2. Tablet untuk pemeriksaan dan pelayanan pasien.
3. Mobile melalui PWA atau APK untuk akses cepat.

## 5. Stakeholder

Stakeholder utama:

1. Owner optik
2. Admin optik
3. Kasir
4. Optometris / RO
5. Petugas stok
6. Pasien sebagai pihak yang datanya dikelola

## 6. Target Pengguna

### 6.1 Owner

Owner membutuhkan sistem untuk melihat kondisi operasional optik secara ringkas.

Kebutuhan owner:

1. Melihat jumlah pasien.
2. Melihat transaksi harian.
3. Melihat stok menipis.
4. Melihat laporan sederhana.
5. Memantau performa toko.

### 6.2 Admin

Admin bertanggung jawab mengelola data master dan operasional.

Kebutuhan admin:

1. Mengelola data pasien.
2. Mengelola data stok.
3. Mengelola transaksi.
4. Melihat riwayat pasien.
5. Memperbaiki data bila ada kesalahan input.

### 6.3 Optometris / RO

Optometris membutuhkan sistem untuk mencatat hasil pemeriksaan mata dan membandingkannya dengan resep dokter luar.

Kebutuhan optometris:

1. Input hasil pemeriksaan optik.
2. Input data OD/OS secara jelas.
3. Melihat resep dokter luar.
4. Membandingkan hasil optik dengan resep luar.
5. Menambahkan catatan pemeriksaan.

### 6.4 Kasir

Kasir membutuhkan transaksi yang sederhana dan cepat.

Kebutuhan kasir:

1. Memilih pasien.
2. Memilih resep yang digunakan.
3. Memilih barang atau jasa.
4. Mengubah harga item bila diperlukan.
5. Mengubah jumlah barang.
6. Mencatat DP atau pembayaran lunas.
7. Mencetak invoice.

### 6.5 Petugas Stok

Petugas stok membutuhkan pencatatan frame, lensa, dan pergerakan stok.

Kebutuhan petugas stok:

1. Input stok masuk.
2. Melihat stok tersedia.
3. Melihat stok minimum.
4. Mencatat koreksi stok.
5. Melihat barang yang digunakan pada transaksi.

## 7. Ruang Lingkup Sistem

### 7.1 Scope MVP

Scope minimum yang harus tersedia:

1. Login pengguna.
2. Dashboard ringkas.
3. Data pasien.
4. Detail pasien lengkap.
5. Input resep dokter luar.
6. Input hasil pemeriksaan optik.
7. Komparasi resep dokter luar vs hasil optik.
8. Riwayat pemeriksaan pasien.
9. Riwayat transaksi pasien.
10. Data stok frame dan lensa.
11. Transaksi sederhana.
12. Custom harga item transaksi.
13. Custom jumlah item transaksi.
14. Pembayaran DP atau lunas.
15. Invoice sederhana.
16. PWA installable.

### 7.2 Non-Scope MVP

Hal berikut tidak menjadi prioritas MVP:

1. POS retail lengkap dengan barcode scanner tingkat lanjut.
2. Integrasi payment gateway otomatis.
3. Integrasi BPJS resmi secara langsung.
4. Multi-cabang kompleks.
5. Akuntansi lengkap.
6. Payroll.
7. CRM lanjutan.
8. Loyalty program.
9. Mobile native full dari awal.
10. Offline-first penuh.

## 8. Konsep Produk

Konsep utama sistem adalah Patient 360, yaitu seluruh data penting pasien dapat dilihat dari satu halaman detail pasien.

Halaman detail pasien harus menjadi pusat sistem. Dari halaman ini user dapat melihat:

1. Identitas pasien.
2. Nomor HP.
3. NIK.
4. Nomor BPJS jika tersedia.
5. Riwayat resep dokter luar.
6. Riwayat pemeriksaan optik.
7. Perbandingan resep.
8. Riwayat transaksi.
9. Invoice.
10. Status pesanan.
11. Catatan pasien.

## 9. Alur Bisnis Utama

### 9.1 Alur Pendataan Pasien

```text
User membuka menu Pasien
-> mencari pasien berdasarkan nama / HP / NIK
-> jika pasien belum ada, user membuat data pasien baru
-> sistem menyimpan data pasien
-> user masuk ke halaman detail pasien
```

Data wajib minimum:

1. Nama pasien.
2. Nomor HP atau identitas lain sesuai kebijakan optik.

Data optional:

1. NIK.
2. Tanggal lahir.
3. Alamat.
4. Jenis kelamin.
5. Nomor BPJS.

Catatan penting: nomor BPJS bersifat optional dan tidak boleh menjadi syarat wajib pembuatan pasien.

### 9.2 Alur Input Resep Dokter Luar

```text
User membuka detail pasien
-> pilih tambah resep dokter luar
-> pilih sumber resep
-> input data OD/OS
-> input PD dan tipe lensa
-> input nama dokter/fasilitas jika ada
-> simpan resep
```

Sumber resep dokter luar:

1. BPJS
2. Klinik
3. Dokter praktek
4. Rumah sakit
5. Lainnya

Nomor BPJS pada resep BPJS bersifat optional.

### 9.3 Alur Input Pemeriksaan Optik

```text
User membuka detail pasien
-> pilih tambah pemeriksaan optik
-> input hasil pemeriksaan OD/OS
-> input PD dan tipe lensa
-> input keluhan dan catatan
-> simpan pemeriksaan
```

Hasil pemeriksaan optik akan tersimpan sebagai data internal optik dan dapat dibandingkan dengan resep luar.

### 9.4 Alur Komparasi Resep

```text
User membuka detail pasien
-> pilih menu Komparasi
-> pilih resep dokter luar
-> pilih hasil pemeriksaan optik
-> sistem menampilkan perbandingan dua kolom
```

Perbandingan ditampilkan dalam format:

```text
Resep Dokter Luar | Hasil Pemeriksaan Optik
```

Field yang dibandingkan:

1. OD SPH
2. OD CYL
3. OD Axis
4. OD ADD
5. OS SPH
6. OS CYL
7. OS Axis
8. OS ADD
9. PD
10. Tipe lensa
11. Catatan

Sistem dapat memberikan highlight:

1. Nilai sama.
2. Nilai berbeda.
3. Data kosong.
4. Perbedaan signifikan.

### 9.5 Alur Transaksi Sederhana

```text
User membuka detail pasien atau menu Transaksi
-> pilih pasien
-> pilih resep yang digunakan jika ada
-> tambah frame / lensa / jasa
-> user bisa custom harga
-> user bisa custom qty
-> input diskon jika ada
-> input DP atau pembayaran lunas
-> simpan transaksi
-> cetak invoice
```

Transaksi harus tetap sederhana dan tidak memaksa user masuk ke POS yang terlalu detail.

### 9.6 Alur Stok

```text
User membuka menu Stok
-> melihat daftar frame/lensa
-> tambah stok masuk
-> koreksi stok jika diperlukan
-> stok otomatis berkurang saat transaksi frame/lensa
```

Stok hanya berkurang untuk item fisik seperti frame dan lensa. Item jasa tidak mengurangi stok.

## 10. Struktur Menu

Struktur menu desktop:

```text
Dashboard
Pasien
Pemeriksaan
Stok
Transaksi
Laporan
Pengaturan
```

Struktur bottom navigation untuk mobile/PWA:

```text
Dashboard | Pasien | Periksa | Transaksi | Stok
```

## 11. Kebutuhan Fungsional

### 11.1 Login dan Hak Akses

Sistem harus menyediakan login pengguna.

Role awal:

1. Admin
2. Kasir
3. Optometris
4. Owner

Kebutuhan:

1. User dapat login.
2. User dapat logout.
3. User hanya dapat mengakses fitur sesuai role.
4. Sistem menyimpan aktivitas penting dalam log.

### 11.2 Dashboard

Dashboard harus ringan dan tidak berisi POS penuh.

Dashboard menampilkan:

1. Jumlah pasien hari ini.
2. Jumlah pemeriksaan hari ini.
3. Total transaksi hari ini.
4. Stok menipis.
5. Transaksi terbaru.
6. Shortcut tambah pasien.
7. Shortcut tambah pemeriksaan.
8. Shortcut transaksi baru.

### 11.3 Manajemen Pasien

Sistem harus dapat:

1. Menampilkan daftar pasien.
2. Mencari pasien berdasarkan nama.
3. Mencari pasien berdasarkan nomor HP.
4. Mencari pasien berdasarkan NIK.
5. Membuat pasien baru.
6. Mengubah data pasien.
7. Melihat detail pasien.
8. Melihat riwayat pemeriksaan pasien.
9. Melihat riwayat transaksi pasien.

Field pasien:

1. Nama pasien.
2. Nomor HP.
3. NIK.
4. Jenis kelamin.
5. Tanggal lahir.
6. Alamat.
7. Nomor BPJS.

Nomor BPJS optional.

### 11.4 Detail Pasien / Patient 360

Halaman detail pasien harus menampilkan:

1. Profil pasien.
2. Ringkasan pemeriksaan terakhir.
3. Ringkasan resep dokter luar terakhir.
4. Riwayat resep dokter luar.
5. Riwayat pemeriksaan optik.
6. Komparasi resep.
7. Riwayat transaksi.
8. Riwayat invoice.
9. Status pesanan.
10. Catatan pasien.

### 11.5 Resep Dokter Luar

Sistem harus dapat mencatat resep dari luar optik.

Field:

1. Sumber resep.
2. Nama dokter.
3. Nama fasilitas.
4. Nomor rujukan jika ada.
5. Tanggal resep.
6. OD SPH.
7. OD CYL.
8. OD Axis.
9. OD ADD.
10. OS SPH.
11. OS CYL.
12. OS Axis.
13. OS ADD.
14. PD.
15. Tipe lensa.
16. Catatan.

Sumber resep:

1. BPJS.
2. Klinik.
3. Dokter praktek.
4. Rumah sakit.
5. Lainnya.

### 11.6 Pemeriksaan Optik

Sistem harus dapat mencatat hasil pemeriksaan optik internal.

Field:

1. Tanggal pemeriksaan.
2. Petugas pemeriksa.
3. Keluhan pasien.
4. OD SPH.
5. OD CYL.
6. OD Axis.
7. OD ADD.
8. OS SPH.
9. OS CYL.
10. OS Axis.
11. OS ADD.
12. PD.
13. Tipe lensa.
14. Hasil trial lens.
15. Rekomendasi.
16. Catatan.

### 11.7 Komparasi Resep

Sistem harus menyediakan tampilan perbandingan dua data:

1. Resep dokter luar.
2. Hasil pemeriksaan optik.

Kebutuhan tampilan:

1. Dua kolom perbandingan.
2. Nilai OD/OS mudah dibaca.
3. Perbedaan nilai diberi penanda visual.
4. Data kosong diberi penanda.
5. User dapat memilih pasangan resep yang dibandingkan.
6. Komparasi bisa dibuka dari detail pasien.

### 11.8 Stok Frame dan Lensa

Sistem harus dapat:

1. Menampilkan daftar frame.
2. Menampilkan daftar lensa.
3. Menambah data frame.
4. Menambah data lensa.
5. Mengubah harga jual.
6. Mengubah harga modal.
7. Mencatat stok masuk.
8. Mencatat stok keluar.
9. Mencatat koreksi stok.
10. Menampilkan stok minimum.
11. Memberi tanda stok menipis.

Data frame:

1. Brand.
2. Model.
3. SKU.
4. Warna.
5. Harga modal.
6. Harga jual.
7. Stok.
8. Supplier.

Data lensa:

1. Brand.
2. Tipe.
3. Fitur.
4. Index.
5. Harga modal.
6. Harga jual.
7. Stok.
8. Supplier.

### 11.9 Transaksi Sederhana

Sistem harus menyediakan transaksi sederhana, bukan POS kompleks.

Kebutuhan:

1. Pilih pasien.
2. Pilih resep yang digunakan jika ada.
3. Tambah frame.
4. Tambah lensa.
5. Tambah jasa.
6. Custom harga item.
7. Custom jumlah item.
8. Diskon transaksi.
9. Input DP.
10. Input pelunasan.
11. Pilih metode pembayaran.
12. Cetak invoice.
13. Simpan transaksi ke riwayat pasien.

Item transaksi:

1. Frame.
2. Lensa.
3. Jasa.

Metode pembayaran:

1. Tunai.
2. Transfer.
3. Debit.
4. Kredit.
5. BPJS.

Catatan: metode BPJS dapat digunakan sebagai penanda klaim/manual record, bukan integrasi resmi BPJS pada MVP.

### 11.10 Invoice

Sistem harus dapat membuat invoice sederhana.

Invoice berisi:

1. Nomor invoice.
2. Tanggal transaksi.
3. Data pasien.
4. Item transaksi.
5. Qty.
6. Harga item.
7. Diskon.
8. Total.
9. DP.
10. Sisa pembayaran.
11. Metode pembayaran.
12. Status pembayaran.

### 11.11 Riwayat Transaksi

Sistem harus dapat:

1. Menampilkan daftar transaksi.
2. Mencari transaksi berdasarkan pasien.
3. Melihat detail transaksi.
4. Melihat invoice.
5. Mencatat pelunasan.
6. Mengubah status pesanan.

Status pesanan:

1. Pending.
2. Diproses.
3. Siap.
4. Selesai.
5. Dibatalkan.

Status pembayaran:

1. Belum bayar.
2. DP.
3. Lunas.

## 12. Kebutuhan Data

### 12.1 Data Pasien

```ts
type Patient = {
  id: string
  name: string
  phone?: string
  nik?: string
  gender?: "male" | "female"
  birth_date?: string
  address?: string
  bpjs_number?: string
}
```

### 12.2 Data Pemeriksaan

```ts
type EyeExamination = {
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
```

### 12.3 Data Resep

```ts
type Prescription = {
  id: string
  examination_id: string
  type: "monofocal" | "bifocal" | "progressive"
  pd?: number
  details: PrescriptionDetail[]
}
```

### 12.4 Detail Resep

```ts
type PrescriptionDetail = {
  eye: "R" | "L"
  sph: number
  cyl?: number
  axis?: number
  add_power?: number
}
```

### 12.5 Data Item Transaksi

```ts
type TransactionItem = {
  product_type: "frame" | "lens" | "service"
  product_id?: string | null
  name: string
  price: number
  qty: number
  subtotal: number
}
```

### 12.6 Data Transaksi

```ts
type Transaction = {
  id: string
  patient_id: string
  prescription_id?: string | null
  items: TransactionItem[]
  discount: number
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: "unpaid" | "dp" | "paid"
  order_status: "pending" | "processed" | "ready" | "completed" | "cancelled"
}
```

## 13. Kebutuhan Non-Fungsional

### 13.1 Platform

Sistem harus mendukung:

1. Web browser modern.
2. PWA installable.
3. APK melalui wrapper seperti Capacitor atau TWA.

### 13.2 Responsiveness

Sistem harus nyaman digunakan pada:

1. Desktop.
2. Tablet.
3. Mobile.

Mobile tidak harus memiliki semua tampilan sepadat desktop, tetapi fungsi utama pasien, pemeriksaan, komparasi, dan transaksi harus tetap dapat digunakan.

### 13.3 Performance

Kebutuhan performa:

1. Daftar pasien harus cepat dicari.
2. Detail pasien tidak boleh terasa berat.
3. Data riwayat dapat menggunakan pagination.
4. Dashboard harus ringan.

### 13.4 Security

Kebutuhan keamanan:

1. Sistem menggunakan login.
2. Password disimpan dalam bentuk hash.
3. Token autentikasi digunakan untuk API.
4. Data pasien hanya dapat diakses oleh user terotorisasi.
5. Aktivitas penting dicatat dalam audit log.

### 13.5 Audit Trail

Aktivitas yang perlu dicatat:

1. Membuat pasien.
2. Mengubah pasien.
3. Membuat resep.
4. Mengubah resep.
5. Membuat transaksi.
6. Mengubah pembayaran.
7. Mengubah stok.

### 13.6 Backup

Sistem perlu mendukung backup database secara berkala pada tahap production.

## 14. Business Rules

1. Nomor BPJS optional.
2. Pasien dapat dibuat tanpa nomor BPJS.
3. Resep BPJS dapat dicatat tanpa nomor BPJS.
4. Transaksi dapat dibuat tanpa resep jika optik mengizinkan.
5. Transaksi dengan resep harus menyimpan resep yang digunakan.
6. Harga barang saat transaksi boleh berbeda dari harga master.
7. Qty item transaksi boleh dicustom.
8. Qty frame/lensa tidak boleh melebihi stok tersedia kecuali admin mengizinkan override.
9. Item jasa tidak mengurangi stok.
10. Stok frame/lensa berkurang saat transaksi berhasil.
11. Diskon tidak boleh membuat total transaksi minus.
12. DP tidak boleh lebih besar dari total akhir.
13. Status pembayaran menjadi lunas jika total pembayaran sama dengan total akhir.
14. Perbandingan resep hanya membandingkan data dalam pasien yang sama.

## 15. Validasi

### 15.1 Validasi Pasien

1. Nama wajib.
2. Nomor HP optional atau wajib sesuai kebijakan optik.
3. NIK optional.
4. Nomor BPJS optional.
5. Nomor BPJS tidak boleh menjadi blocker.

### 15.2 Validasi Resep

1. Eye wajib R atau L.
2. Axis harus 0 sampai 180 jika CYL diisi.
3. PD idealnya berada pada rentang 40 sampai 80.
4. ADD idealnya 0 sampai 4.
5. Tipe lensa wajib jika resep digunakan untuk transaksi lensa.

### 15.3 Validasi Transaksi

1. Pasien wajib dipilih.
2. Item transaksi minimal satu.
3. Qty minimal satu.
4. Harga tidak boleh negatif.
5. Diskon tidak boleh melebihi subtotal.
6. DP tidak boleh negatif.
7. DP tidak boleh melebihi total akhir.

## 16. Rekomendasi UX

### 16.1 Prinsip UX

1. Data pasien menjadi pusat navigasi.
2. Komparasi resep harus mudah dibaca.
3. Transaksi harus sederhana.
4. Jangan menampilkan POS penuh di dashboard.
5. Field resep harus terasa seperti form klinis.
6. Tampilan mobile harus fokus pada aksi utama.

### 16.2 Layout Detail Pasien

```text
Header Pasien
- Nama
- HP
- NIK
- BPJS jika ada

Tab:
- Ringkasan
- Resep & Pemeriksaan
- Komparasi
- Transaksi
- Catatan
```

### 16.3 Layout Komparasi

```text
-------------------------------------------------
| Resep Dokter Luar     | Hasil Pemeriksaan Optik |
-------------------------------------------------
| OD SPH                | OD SPH                  |
| OD CYL                | OD CYL                  |
| OD Axis               | OD Axis                 |
| OD ADD                | OD ADD                  |
| OS SPH                | OS SPH                  |
| OS CYL                | OS CYL                  |
| OS Axis               | OS Axis                 |
| OS ADD                | OS ADD                  |
| PD                    | PD                      |
-------------------------------------------------
```

### 16.4 Layout Transaksi

```text
Pilih pasien / otomatis dari detail pasien
Pilih resep yang digunakan
Tambah item
Ringkasan pembayaran
Simpan transaksi
Cetak invoice
```

## 17. PWA dan APK

### 17.1 PWA

PWA harus mendukung:

1. Install ke home screen.
2. App icon.
3. Splash screen dasar.
4. Responsive layout.
5. Cache asset dasar.

### 17.2 APK

APK dapat dibuat setelah PWA stabil.

Opsi teknis:

1. Capacitor jika perlu akses fitur device seperti kamera.
2. TWA jika hanya membungkus PWA ke Android.

Rekomendasi: gunakan PWA terlebih dahulu, lalu bungkus menjadi APK setelah flow utama stabil.

## 18. Integrasi

### 18.1 Integrasi Internal

Integrasi yang dibutuhkan dalam sistem:

1. Pasien dengan pemeriksaan.
2. Pasien dengan resep.
3. Pasien dengan transaksi.
4. Transaksi dengan stok.
5. Transaksi dengan invoice.
6. Pemeriksaan dengan komparasi resep.

### 18.2 Integrasi Eksternal

Tidak ada integrasi eksternal wajib pada MVP.

Integrasi yang dapat dipertimbangkan setelah MVP:

1. WhatsApp reminder.
2. Payment gateway.
3. BPJS resmi jika memungkinkan.
4. OCR foto resep.

## 19. Acceptance Criteria

### 19.1 Pasien

1. User dapat membuat pasien tanpa nomor BPJS.
2. User dapat mencari pasien.
3. User dapat membuka detail pasien.
4. User dapat melihat riwayat pasien dari satu halaman.

### 19.2 Resep Dokter Luar

1. User dapat input resep dari BPJS, klinik, dokter praktek, rumah sakit, atau lainnya.
2. Nomor BPJS tidak wajib.
3. Resep tersimpan pada pasien yang benar.

### 19.3 Pemeriksaan Optik

1. User dapat input hasil pemeriksaan optik.
2. Pemeriksaan tersimpan pada pasien.
3. Pemeriksaan dapat dipilih untuk dibandingkan.

### 19.4 Komparasi

1. User dapat memilih resep dokter luar.
2. User dapat memilih hasil pemeriksaan optik.
3. Sistem menampilkan dua kolom perbandingan.
4. Perbedaan nilai terlihat jelas.

### 19.5 Transaksi

1. User dapat membuat transaksi dari detail pasien.
2. User dapat memilih resep yang digunakan.
3. User dapat menambah frame, lensa, atau jasa.
4. User dapat mengubah harga item.
5. User dapat mengubah qty item.
6. Sistem menghitung total.
7. Sistem menyimpan pembayaran DP atau lunas.
8. Sistem membuat invoice.

### 19.6 Stok

1. User dapat melihat stok frame dan lensa.
2. User dapat menambah stok masuk.
3. Stok frame/lensa berkurang saat transaksi.
4. Item jasa tidak mengurangi stok.

### 19.7 PWA/APK

1. Aplikasi dapat dibuka di browser.
2. Aplikasi dapat diinstall sebagai PWA.
3. APK dapat dibuat dari PWA setelah MVP stabil.

## 20. Prioritas Implementasi

### 20.1 Prioritas Tinggi

1. Detail pasien / Patient 360.
2. Input resep dokter luar.
3. Input pemeriksaan optik.
4. Komparasi resep.
5. Transaksi sederhana dengan custom harga dan qty.
6. Nomor BPJS optional di frontend dan backend.

### 20.2 Prioritas Sedang

1. Invoice yang lebih rapi.
2. Stok masuk/keluar lebih detail.
3. Reminder pasien.
4. Dashboard owner.
5. PWA polish.

### 20.3 Prioritas Rendah

1. APK production.
2. OCR resep.
3. Integrasi WhatsApp.
4. Payment gateway.
5. Integrasi BPJS resmi.

## 21. Risiko dan Mitigasi

### 21.1 Risiko: Scope melebar menjadi POS kompleks

Mitigasi:

1. Fokus MVP pada pasien, komparasi, stok, dan transaksi sederhana.
2. Hindari fitur POS retail yang tidak dibutuhkan client.

### 21.2 Risiko: Data resep tidak konsisten

Mitigasi:

1. Buat form OD/OS standar.
2. Terapkan validasi axis, PD, dan ADD.
3. Pisahkan sumber resep luar dan pemeriksaan internal.

### 21.3 Risiko: User bingung memilih resep yang digunakan

Mitigasi:

1. Tampilkan ringkasan resep terakhir.
2. Beri label sumber resep.
3. Tampilkan tanggal pemeriksaan.

### 21.4 Risiko: APK terlalu cepat dibuat sebelum flow stabil

Mitigasi:

1. Stabilkan PWA terlebih dahulu.
2. Bungkus ke APK setelah modul utama selesai.

## 22. Rekomendasi Tahapan Project

### Tahap 1: Foundation

1. Rapikan requirement.
2. Update validasi BPJS menjadi optional.
3. Siapkan struktur data sumber resep.
4. Siapkan halaman detail pasien.

### Tahap 2: Patient 360

1. Buat tampilan detail pasien.
2. Tambahkan riwayat pemeriksaan.
3. Tambahkan riwayat transaksi.
4. Tambahkan tab catatan.

### Tahap 3: Pemeriksaan dan Komparasi

1. Buat form resep dokter luar.
2. Buat form pemeriksaan optik.
3. Buat tampilan komparasi.
4. Tambahkan highlight perbedaan.

### Tahap 4: Transaksi Sederhana

1. Buat transaksi dari pasien.
2. Tambah item frame/lensa/jasa.
3. Custom harga.
4. Custom qty.
5. Pembayaran DP/lunas.
6. Invoice.

### Tahap 5: PWA/APK

1. Tambahkan manifest.
2. Tambahkan app icon.
3. Optimasi mobile.
4. Build APK wrapper setelah PWA stabil.

## 23. Definisi Sukses

Project dianggap berhasil jika:

1. Client dapat melihat data pasien lengkap dari satu halaman.
2. Client dapat membandingkan resep dokter luar dengan hasil pemeriksaan optik.
3. Nomor BPJS tidak menjadi hambatan input data.
4. User dapat membuat transaksi sederhana tanpa POS yang rumit.
5. Harga dan qty item transaksi dapat dicustom.
6. Stok tetap tercatat dengan benar.
7. Sistem dapat digunakan sebagai PWA.
8. Sistem siap dibungkus menjadi APK setelah MVP stabil.

