const { NodeSSH } = require('node-ssh');
const s = new NodeSSH();
s.connect(require('./.secrets.json').vps).then(async () => {

  // Wait for backend to fully boot
  await new Promise(r => setTimeout(r, 4000));

  // Test login via localhost direct
  const login = await s.execCommand('curl -s http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":"password123"}\'');
  console.log('=== DIRECT API LOGIN ===');
  console.log(login.stdout);

  // Test via nginx proxy (domain route)
  const nginx = await s.execCommand('curl -s http://optik.codenusa.id/api/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":"password123"}\'');
  console.log('\n=== NGINX PROXY LOGIN ===');
  console.log(nginx.stdout);

  // Check stdout log for route mapping
  const routes = await s.execCommand('grep "auth/login" /root/.pm2/logs/optik88-backend-out-9.log | tail -3');
  console.log('\n=== AUTH ROUTE REGISTERED ===');
  console.log(routes.stdout);

  // PM2 stability check
  const pm2 = await s.execCommand('pm2 show optik88-backend | grep -E "status|restarts|uptime"');
  console.log('\n=== STABILITY CHECK ===');
  console.log(pm2.stdout);

  s.dispose();
});
