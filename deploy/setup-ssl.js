const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const cfg = require('./.secrets.json');

(async () => {
  try {
    await ssh.connect(cfg.vps);
    console.log('✅ Connected!\n');

    // Step 1: Install certbot + nginx plugin
    console.log('📦 Installing certbot...');
    let res = await ssh.execCommand(
      'apt-get install -y certbot python3-certbot-nginx 2>&1 | tail -5'
    );
    console.log(res.stdout || res.stderr);

    // Step 2: Cek apakah certbot sudah ada
    res = await ssh.execCommand('certbot --version');
    console.log('Certbot version:', res.stdout || res.stderr);

    // Step 3: Jalankan certbot untuk optik.codenusa.id saja (tidak ganggu bengkel)
    console.log('\n🔐 Setting up SSL for optik.codenusa.id...');
    res = await ssh.execCommand(
      'certbot --nginx -d optik.codenusa.id --non-interactive --agree-tos -m webmaster@codenusa.id --redirect 2>&1'
    );
    console.log(res.stdout || res.stderr);

    // Step 4: Cek nginx config setelah certbot
    res = await ssh.execCommand('nginx -t 2>&1');
    console.log('\nNginx test:', res.stdout || res.stderr);

    // Step 5: Test HTTPS
    res = await ssh.execCommand(
      'curl -s -o /dev/null -w "HTTPS Status: %{http_code}" https://optik.codenusa.id/ 2>&1'
    );
    console.log(res.stdout);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    ssh.dispose();
  }
})();
