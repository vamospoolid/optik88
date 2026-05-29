const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const cfg = require('./.secrets.json');

(async () => {
  try {
    await ssh.connect(cfg.vps);
    console.log('✅ Connected!\n');

    // Grep URL di dalam file api.js yang sudah dibuild
    const res = await ssh.execCommand(
      `grep -o '"[^"]*optik[^"]*"\\|"[^"]*http[^"]*"\\|"[^"]*api[^"]*"' /var/www/optik88/mobile/dist/assets/api-DIUrzL8e.js | head -20`
    );
    console.log('🔧 URL di api.js:');
    console.log(res.stdout || '(kosong)');

    // Juga cek Login-CEv4UHns.js (file yang disorot di error)
    const res2 = await ssh.execCommand(
      `grep -o '"[^"]*http[^"]*"\\|"[^"]*optik[^"]*"' /var/www/optik88/mobile/dist/assets/Login-CEv4UHns.js | head -20`
    );
    console.log('\n🔧 URL di Login.js:');
    console.log(res2.stdout || '(kosong)');

    // Cek isi lengkap api.js (kecil saja - lihat baseURL)
    const res3 = await ssh.execCommand(
      `cat /var/www/optik88/mobile/dist/assets/api-DIUrzL8e.js | head -c 500`
    );
    console.log('\n🔧 Awal api.js:');
    console.log(res3.stdout);

  } catch (err) {
    console.error('❌', err.message);
  } finally {
    ssh.dispose();
  }
})();
