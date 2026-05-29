const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const cfg = require('./.secrets.json');

(async () => {
  try {
    await ssh.connect(cfg.vps);
    console.log('✅ Connected!\n');

    // Test CORS: Simulasi request dari Capacitor Android (origin: capacitor://localhost)
    let res = await ssh.execCommand(
      `curl -s -v -X POST http://optik.codenusa.id/api/auth/login \
      -H "Content-Type: application/json" \
      -H "Origin: capacitor://localhost" \
      -d '{"username":"owner","password":"password123"}' 2>&1`
    );
    console.log('--- CORS Test (Origin: capacitor://localhost) ---');
    console.log(res.stdout);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    ssh.dispose();
  }
})();
