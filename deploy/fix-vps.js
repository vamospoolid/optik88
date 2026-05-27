const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const cfg = require('./.secrets.json');

(async () => {
  await ssh.connect(cfg.vps);
  
  // Wipe old folder
  console.log(await ssh.execCommand('rm -rf /var/www/optik88'));
  console.log(await ssh.execCommand('mkdir -p /var/www/optik88'));
  
  // Kill old PM2 app just in case
  await ssh.execCommand('pm2 delete optik88-backend');
  
  ssh.dispose();
})();
