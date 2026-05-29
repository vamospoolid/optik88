const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const cfg = require('./.secrets.json');

(async () => {
  try {
    await ssh.connect(cfg.vps);
    console.log('Connected to VPS...');

    // Get list of all nginx config files
    let res = await ssh.execCommand('ls -la /etc/nginx/sites-available');
    console.log('\n--- SITES AVAILABLE ---');
    console.log(res.stdout);

    res = await ssh.execCommand('ls -la /etc/nginx/sites-enabled');
    console.log('\n--- SITES ENABLED ---');
    console.log(res.stdout);

    // Read the contents of active config files (like default or bengkel)
    res = await ssh.execCommand('cat /etc/nginx/sites-enabled/*');
    console.log('\n--- CONFIG CONTENTS ---');
    console.log(res.stdout);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    ssh.dispose();
  }
})();
