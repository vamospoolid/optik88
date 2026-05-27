const { NodeSSH } = require('node-ssh');
const s = new NodeSSH();
s.connect(require('./.secrets.json').vps).then(async () => {
  
  // Check FRESH error logs (last few lines only)
  const errors = await s.execCommand('tail -20 /root/.pm2/logs/optik88-backend-error-9.log');
  console.log('=== FRESH ERROR LOGS ===');
  console.log(errors.stdout);

  // Check stdout logs  
  const out = await s.execCommand('tail -20 /root/.pm2/logs/optik88-backend-out-9.log');
  console.log('\n=== STDOUT LOGS ===');
  console.log(out.stdout);

  // Wait 5 seconds and test API
  await new Promise(r => setTimeout(r, 5000));
  
  const api = await s.execCommand('curl -s http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":"password123"}\'');
  console.log('\n=== API LOGIN TEST ===');
  console.log(api.stdout);

  s.dispose();
});
