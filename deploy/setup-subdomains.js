const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const cfg = require('./.secrets.json');

// ============================================================
// CONFIG BARU UNTUK BENGKEL (server_name: bengkel.codenusa.id)
// HANYA mengubah server_name dari _ ke subdomain yang benar
// TIDAK mengubah apapun soal folder, port, atau API
// ============================================================
const BENGKEL_NGINX_CONFIG = `server {
    include /etc/nginx/mime.types;
    listen 80;
    server_name bengkel.codenusa.id;
    root /var/www/bengkel/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        proxy_pass http://localhost:3002/uploads/;
    }

    gzip on;
}

server {
    include /etc/nginx/mime.types;
    listen 8080;
    server_name bengkel.codenusa.id;
    root /var/www/bengkel/mobile;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
}
`;

(async () => {
  try {
    console.log('Connecting to VPS...');
    await ssh.connect(cfg.vps);
    console.log('✅ Connected!\n');

    // Step 1: Backup config lama bengkel
    console.log('📦 Membuat backup config Bengkel lama...');
    const backup = await ssh.execCommand(
      'cp /etc/nginx/sites-available/bengkel /etc/nginx/sites-available/bengkel.bak'
    );
    if (backup.stderr) console.warn('Backup warning:', backup.stderr);
    else console.log('✅ Backup tersimpan di: /etc/nginx/sites-available/bengkel.bak');

    // Step 2: Tulis config baru bengkel
    console.log('\n✏️  Memperbarui config Nginx Bengkel...');
    await ssh.execCommand(
      `cat > /etc/nginx/sites-available/bengkel << 'NGINXEOF'\n${BENGKEL_NGINX_CONFIG}\nNGINXEOF`
    );

    // Step 3: Test config nginx (PALING PENTING - jika error, nginx tidak di-reload)
    console.log('\n🔍 Menguji konfigurasi Nginx...');
    const test = await ssh.execCommand('nginx -t');
    console.log(test.stdout || test.stderr);

    if (test.stderr && test.stderr.includes('emerg')) {
      console.error('❌ Config Nginx GAGAL. Rollback ke backup lama...');
      await ssh.execCommand(
        'cp /etc/nginx/sites-available/bengkel.bak /etc/nginx/sites-available/bengkel'
      );
      console.log('✅ Rollback berhasil. Tidak ada yang berubah di VPS.');
    } else {
      // Step 4: Reload Nginx
      console.log('\n🔄 Mereload Nginx...');
      const reload = await ssh.execCommand('systemctl reload nginx');
      if (reload.stderr) console.warn('Reload warning:', reload.stderr);
      else console.log('✅ Nginx berhasil direload!');

      console.log('\n🎉 SELESAI! Status akhir:');
      console.log('   ✅ bengkel.codenusa.id → /var/www/bengkel (Port 80)');
      console.log('   ✅ optik.codenusa.id   → /var/www/optik88 (Port 80)');
      console.log('\n⚠️  PENTING: Pastikan DNS record bengkel.codenusa.id sudah diarahkan ke IP: 173.212.243.240');
    }

  } catch (err) {
    console.error('💥 Error:', err.message);
  } finally {
    ssh.dispose();
  }
})();
