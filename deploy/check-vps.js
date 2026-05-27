const { NodeSSH } = require('node-ssh');
const s = new NodeSSH();
s.connect(require('./.secrets.json').vps).then(async () => {
  
  // Check which process is using port 3001
  const portCheck = await s.execCommand('lsof -i :3001 | head -10 || ss -tlnp | grep 3001');
  console.log('=== PORT 3001 USAGE ===');
  console.log(portCheck.stdout || portCheck.stderr);

  // Check current backend errors
  const errors = await s.execCommand('pm2 logs optik88-backend --lines 15 --nostream --err 2>&1');
  console.log('\n=== CURRENT ERRORS ===');
  console.log(errors.stdout);

  // Stop the old optik-backend that is occupying port 3001
  console.log('\nStopping old optik-backend (ID: 5)...');
  const stop = await s.execCommand('pm2 stop optik-backend');
  console.log(stop.stdout);

  // Wait a moment
  await new Promise(r => setTimeout(r, 3000));

  // Restart the new optik88-backend
  console.log('Restarting optik88-backend...');
  await s.execCommand('pm2 restart optik88-backend');
  
  // Wait for startup
  await new Promise(r => setTimeout(r, 6000));

  // Final API test
  const api = await s.execCommand('curl -s -w "\\nHTTP_CODE:%{http_code}" http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":"password123"}\'');
  console.log('\n=== API Login Test ===');
  console.log(api.stdout);

  const pm2 = await s.execCommand('pm2 list');
  console.log('\n=== PM2 STATUS ===');
  console.log(pm2.stdout);

  s.dispose();
});
