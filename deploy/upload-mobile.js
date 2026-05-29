const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');
const ssh = new NodeSSH();
const cfg = require('./.secrets.json');

const localDist = path.resolve(__dirname, '../mobile/dist');
const remoteDist = '/var/www/optik88/mobile/dist';

async function run(cmd, label) {
  console.log(`\n🔧 [${label}]`);
  const res = await ssh.execCommand(cmd);
  if (res.stdout) console.log(res.stdout);
  if (res.stderr) console.log('ERR:', res.stderr);
  return res;
}

(async () => {
  try {
    await ssh.connect(cfg.vps);
    console.log('✅ Connected!\n');

    // Hapus dist lama
    await run(`rm -rf ${remoteDist}`, 'HAPUS DIST LAMA');
    await run(`mkdir -p ${remoteDist}`, 'BUAT FOLDER DIST');

    // Upload dist baru
    console.log('\n📦 Upload mobile dist ke VPS...');
    await ssh.putDirectory(localDist, remoteDist, {
      recursive: true,
      concurrency: 5,
      tick: (localPath, remotePath, error) => {
        if (error) console.log('❌ FAIL:', localPath);
        else process.stdout.write('.');
      }
    });
    console.log('\n✅ Upload selesai!');

    // Verifikasi
    await run(`ls -la ${remoteDist}/assets/ | wc -l`, 'JUMLAH FILE ASSETS');
    await run(`grep -o 'https://optik.codenusa' ${remoteDist}/assets/api-*.js | head -1 || echo "URL tidak ditemukan"`, 'VERIFIKASI URL HTTPS');

    // Test final HTTPS API
    await run(
      `curl -s -w "\\nHTTP_CODE: %{http_code}" https://optik.codenusa.id/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"owner","password":"password123"}'`,
      'TEST API HTTPS'
    );

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    ssh.dispose();
    console.log('\n✅ Done.');
  }
})();
