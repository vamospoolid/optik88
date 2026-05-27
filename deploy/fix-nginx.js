const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const cfg = require('./.secrets.json');

(async () => {
  await ssh.connect(cfg.vps);
  
  // Hapus symlink optik88 dari enabled
  await ssh.execCommand('rm -f /etc/nginx/sites-enabled/optik88');
  
  // Jika ada backup default, restore (Jakarta Motor mungkin jalan di default config)
  await ssh.execCommand('ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default');
  
  // Atau mari kita cek config apa saja yang ada
  const res = await ssh.execCommand('ls -la /etc/nginx/sites-available');
  console.log('SITES AVAILABLE:');
  console.log(res.stdout);
  
  const res2 = await ssh.execCommand('ls -la /etc/nginx/sites-enabled');
  console.log('SITES ENABLED:');
  console.log(res2.stdout);
  
  // Reload nginx
  await ssh.execCommand('systemctl reload nginx');
  console.log('Nginx reloaded to try restoring old config.');
  
  ssh.dispose();
})();
