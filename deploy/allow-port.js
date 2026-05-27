const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const cfg = require('./.secrets.json');

(async () => {
  await ssh.connect(cfg.vps);
  
  // Allow port 8080
  const res = await ssh.execCommand('ufw allow 8080/tcp');
  console.log(res.stdout);
  
  ssh.dispose();
})();
