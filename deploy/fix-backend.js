const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const cfg = require('./.secrets.json');

async function run(cmd, label) {
  console.log(`\n🔧 [${label}]`);
  const res = await ssh.execCommand(cmd, { execOptions: { pty: false } });
  if (res.stdout) console.log(res.stdout);
  if (res.stderr && res.stderr.length < 2000) console.log('STDERR:', res.stderr);
  return res;
}

(async () => {
  try {
    await ssh.connect(cfg.vps);
    console.log('✅ Connected!\n');

    // 1. Cek log error terbaru dari optik88-backend
    await run('pm2 logs optik88-backend --err --lines 50 --nostream 2>&1', 'ERROR LOGS TERBARU');

    // 2. Cek apakah main.js ada
    await run('ls -la /var/www/optik88/backend/dist/main.js 2>/dev/null || echo "MAIN.JS NOT FOUND"', 'CEK MAIN.JS');

    // 3. Cek package.json untuk start command
    await run('cat /var/www/optik88/backend/package.json', 'PACKAGE.JSON');

    // FIX: Stop semua instance optik88-backend dan jalankan ulang dalam mode fork (bukan cluster)
    console.log('\n🔨 FIXING: Stop semua optik88-backend...');
    await run('pm2 delete optik88-backend 2>/dev/null || echo "already deleted"', 'DELETE PM2');
    
    // Tunggu sebentar
    await new Promise(r => setTimeout(r, 2000));

    // Start ulang dalam mode FORK (bukan cluster!)
    await run(
      'cd /var/www/optik88/backend && PORT=3001 pm2 start dist/main.js --name optik88-backend --no-autorestart 2>&1',
      'START FRESH (FORK MODE)'
    );

    // Tunggu startup
    await new Promise(r => setTimeout(r, 5000));

    // Cek status
    await run('pm2 list', 'STATUS PM2');

    // Cek log startup
    await run('pm2 logs optik88-backend --lines 20 --nostream 2>&1', 'STARTUP LOGS');

    // Test API
    await run(
      'curl -s -w "\\nHTTP_CODE: %{http_code}\\n" http://127.0.0.1:3001/api/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"owner","password":"password123"}\'',
      'TEST API'
    );

    // Jika berhasil, save pm2
    await run('pm2 save', 'SAVE PM2');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    ssh.dispose();
    console.log('\n✅ Done.');
  }
})();
