# Panduan Deployment Optik88 (Web PWA, VPS, dan Mobile APK)

Dokumen ini berisi panduan *step-by-step* untuk mempublikasikan proyek Optik88 ke GitHub, melakukan *deploy* ke VPS dengan domain `optik.codenusa.id`, dan mem-*build* APK Android tanpa terkena *error* CORS.

---

## TAHAP 1: Upload Project ke GitHub
Lakukan ini di komputer lokal (Windows) Anda.

1. Buka Terminal/PowerShell, pastikan Anda berada di direktori proyek `d:\APPS\optikbaru`.
2. Ketik perintah berikut secara berurutan:
   ```bash
   git init
   git add .
   git commit -m "First release MVP Optik88"
   ```
3. Buka GitHub.com, buat repositori baru (misalnya `optik88`).
4. Salin URL repositori Anda, lalu hubungkan dan *push*:
   ```bash
   git remote add origin https://github.com/USERNAME_ANDA/optik88.git
   git branch -M main
   git push -u origin main
   ```

---

## TAHAP 2: Setup di VPS (Backend & Frontend)
Lakukan ini di dalam Terminal VPS Anda (`ssh root@173.212.243.240`).

### 1. Clone Project dari GitHub
```bash
cd /var/www/
git clone https://github.com/USERNAME_ANDA/optik88.git
cd optik88
```

### 2. Jalankan Backend (NestJS) dengan PM2
```bash
# Masuk ke folder backend
cd /var/www/optik88/backend

# Install dependensi dan build
npm install
npm run build

# Install PM2 jika belum ada
npm install -g pm2

# Jalankan backend di background
pm2 start dist/main.js --name "optik88-api"
pm2 save
pm2 startup
```
*Catatan: Backend sekarang berjalan di `http://localhost:3001` di dalam VPS.*

### 3. Build Frontend Web (PWA)
```bash
# Masuk ke folder mobile (frontend)
cd /var/www/optik88/mobile

# Install dependensi dan build
npm install
npm run build
```
*Hasil build web Anda sekarang berada di `/var/www/optik88/mobile/dist`.*

---

## TAHAP 3: Konfigurasi Nginx & Domain (Anti-CORS)
Kita akan mengatur agar domain `optik.codenusa.id` menyajikan *file* React, dan sub-path `/api` meneruskan (*proxy*) permintaan ke *backend*. **Ini adalah kunci utama agar web tidak terkena Error CORS.**

1. Di VPS, buat file konfigurasi Nginx baru:
   ```bash
   nano /etc/nginx/sites-available/optik.codenusa.id
   ```
2. Isi file tersebut dengan konfigurasi berikut:
   ```nginx
   server {
       listen 80;
       server_name optik.codenusa.id;

       # 1. Frontend React/Vite (PWA)
       root /var/www/optik88/mobile/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # 2. Reverse Proxy untuk API Backend
       location /api/ {
           proxy_pass http://127.0.0.1:3001/api/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Simpan (CTRL+O, Enter, CTRL+X).
4. Aktifkan konfigurasi dan amankan dengan SSL (HTTPS):
   ```bash
   ln -s /etc/nginx/sites-available/optik.codenusa.id /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   
   # Pasang sertifikat SSL (HTTPS) Gratis dari Let's Encrypt
   apt install certbot python3-certbot-nginx -y
   certbot --nginx -d optik.codenusa.id
   ```

Selamat! Sistem web/PWA Anda sudah bisa diakses di `https://optik.codenusa.id` dengan aman.

---

## TAHAP 4: Build Mobile APK (Android)
Lakukan ini di komputer lokal (Windows) Anda menggunakan Capacitor.

*Catatan: Saya telah mengedit file `mobile/src/services/api.ts` di komputer Anda agar bisa menerima `VITE_API_URL` secara dinamis. Ini sangat penting untuk APK.*

1. Buka folder mobile di terminal Windows:
   ```bash
   cd d:\APPS\optikbaru\mobile
   ```
2. Buat file bernama `.env.production` di dalam folder `mobile` tersebut, dan isi dengan:
   ```env
   VITE_API_URL=https://optik.codenusa.id/api
   ```
3. Lakukan build ulang proyek agar URL API tersebut tertanam ke dalam kode *mobile*:
   ```bash
   npm run build
   ```
4. Inisialisasi dan *Build* APK dengan Capacitor (Pastikan Anda sudah menginstall Android Studio):
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init Optik88 com.vamospool.optik88 --web-dir dist
   
   npm install @capacitor/android
   npx cap add android
   npx cap sync android
   
   # Buka proyek di Android Studio untuk di-build menjadi APK
   npx cap open android
   ```
5. Di Android Studio, biarkan proses sinkronisasi Gradle selesai (bisa memakan waktu beberapa menit).
6. Buka menu **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
7. Aplikasi Android Anda (APK) sudah siap dan secara otomatis akan mengambil data dari server `https://optik.codenusa.id/api` tanpa *error* CORS.
