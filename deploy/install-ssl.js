const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const cfg = require('./.secrets.json');

async function run(cmd, label, timeout = 60000) {
  console.log(`\n🔧 [${label}]`);
  const res = await ssh.execCommand(cmd, { execOptions: { pty: false } });
  if (res.stdout) console.log(res.stdout);
  if (res.stderr && !res.stderr.includes('Saving debug log')) console.log('ERR:', res.stderr.substring(0, 500));
  return res;
}

(async () => {
  try {
    await ssh.connect(cfg.vps);
    console.log('✅ Connected!\n');

    // Step 1: Install certbot jika belum ada
    await run('which certbot || apt-get install -y certbot python3-certbot-nginx 2>&1 | tail -5', 'INSTALL CERTBOT');

    // Step 2: Cek apakah sudah ada cert untuk optik.codenusa.id
    await run('certbot certificates 2>&1 | grep -A5 "optik.codenusa\\|Found the"', 'CEK EXISTING CERT');

    // Step 3: Pasang SSL dengan certbot nginx plugin (non-interactive)
    console.log('\n🚀 Memasang SSL certificate untuk optik.codenusa.id...');
    const sslRes = await ssh.execCommand(
      'certbot --nginx -d optik.codenusa.id --non-interactive --agree-tos --email vamospoolid@gmail.com --redirect 2>&1',
      { execOptions: { pty: false } }
    );
    console.log('SSL OUTPUT:', sslRes.stdout);
    if (sslRes.stderr) console.log('SSL ERR:', sslRes.stderr.substring(0, 1000));

    // Step 4: Cek nginx config setelah certbot
    await run('nginx -t 2>&1', 'NGINX TEST');
    await run('systemctl reload nginx 2>&1', 'RELOAD NGINX');

    // Step 5: Cek hasilnya
    await run('cat /etc/nginx/sites-enabled/optik88', 'NGINX CONFIG BARU');

    // Step 6: Test HTTPS
    await run('curl -sv https://optik.codenusa.id/api/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"owner","password":"password123"}\' 2>&1 | grep -E "HTTP/|{\\|error"', 'TEST HTTPS API');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    ssh.dispose();
    console.log('\n✅ Done.');
  }
})();
