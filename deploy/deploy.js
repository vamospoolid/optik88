#!/usr/bin/env node
/**
 * ============================================================
 *  OPTIK88 — Deploy Script
 *  Fungsi  : Push ke GitHub → SSH ke VPS → Install → Build → PM2
 *  Jalankan: node deploy/deploy.js
 * ============================================================
 */

const { execSync, exec } = require('child_process');
const { NodeSSH }        = require('node-ssh');
const path               = require('path');
const fs                 = require('fs');

// ── Load secrets ─────────────────────────────────────────────
const SECRETS_PATH = path.join(__dirname, '.secrets.json');
if (!fs.existsSync(SECRETS_PATH)) {
  console.error('❌  File deploy/.secrets.json tidak ditemukan!');
  console.error('    Buat file tersebut berdasarkan deploy/.secrets.example.json');
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf-8'));

const VPS    = cfg.vps;
const GH     = cfg.github;
const APP    = cfg.app;

const ROOT   = path.join(__dirname, '..');
const REPO   = `https://github.com/${GH.username}/${GH.repo}.git`;
const BRANCH = 'main';

// ── Helpers ───────────────────────────────────────────────────
const log  = (msg)  => console.log(`\n\x1b[36m▶  ${msg}\x1b[0m`);
const ok   = (msg)  => console.log(`\x1b[32m✔  ${msg}\x1b[0m`);
const err  = (msg)  => console.error(`\x1b[31m✖  ${msg}\x1b[0m`);
const run  = (cmd, cwd = ROOT) => {
  console.log(`   $ ${cmd}`);
  return execSync(cmd, { cwd, stdio: 'inherit' });
};

// ── STEP 1 : Git init & push ke GitHub ───────────────────────
async function pushToGithub() {
  log('STEP 1 — Push ke GitHub');

  const isGit = fs.existsSync(path.join(ROOT, '.git'));
  if (!isGit) {
    run('git init');
    run(`git remote add origin ${REPO}`);
    ok('Git repo diinisialisasi');
  } else {
    // Pastikan remote 'origin' sudah benar
    try {
      const remote = execSync('git remote get-url origin', { cwd: ROOT }).toString().trim();
      if (!remote.includes(GH.repo)) {
        run(`git remote set-url origin ${REPO}`);
      }
    } catch {
      run(`git remote add origin ${REPO}`);
    }
  }

  run('git add -A');

  const commitMsg = `chore: deploy ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;
  try {
    run(`git commit -m "${commitMsg}"`);
  } catch {
    ok('Tidak ada perubahan baru — skip commit');
  }

  run(`git branch -M ${BRANCH}`);
  run(`git push -u origin ${BRANCH}`);
  ok(`Kode berhasil di-push ke github.com/${GH.username}/${GH.repo}`);
}

// ── STEP 2 : SSH ke VPS & deploy ──────────────────────────────
async function deployToVPS() {
  log('STEP 2 — Koneksi SSH ke VPS ' + VPS.host);

  const ssh = new NodeSSH();
  await ssh.connect({
    host:     VPS.host,
    port:     VPS.port,
    username: VPS.username,
    password: VPS.password,
    readyTimeout: 20000,
  });
  ok('SSH terhubung');

  // Fungsi helper: jalankan command di VPS dan print output
  const remote = async (cmd, label = cmd) => {
    console.log(`   [VPS] $ ${cmd}`);
    const result = await ssh.execCommand(cmd, { cwd: APP.dir });
    if (result.stdout) console.log(result.stdout);
    if (result.stderr) console.error('\x1b[33m' + result.stderr + '\x1b[0m');
    if (result.code !== null && result.code !== 0) {
      throw new Error(`Command gagal (exit ${result.code}): ${label}`);
    }
    return result.stdout;
  };

  // ── 2a. Install dependensi sistem (Node, PM2, git) ──────────
  log('STEP 2a — Cek & install Node.js + PM2 di VPS');
  await ssh.execCommand(`
    set -e
    # Install NVM jika belum ada
    if ! command -v node &> /dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y nodejs
    fi
    # Install PM2 global
    if ! command -v pm2 &> /dev/null; then
      npm install -g pm2
    fi
    # Install git jika belum ada
    if ! command -v git &> /dev/null; then
      apt-get update && apt-get install -y git
    fi
    node -v && npm -v && pm2 -v
  `).then(r => {
    if (r.stdout) console.log(r.stdout);
    if (r.stderr && !r.stderr.includes('npm warn')) console.log(r.stderr);
  });
  ok('Node.js & PM2 siap');

  // ── 2b. Clone atau pull repo ──────────────────────────────────
  log('STEP 2b — Clone / Pull repo dari GitHub');
  const cloneOrPull = `
    if [ -d "${APP.dir}/.git" ]; then
      cd ${APP.dir} && git pull origin ${BRANCH}
    else
      mkdir -p ${APP.dir}
      git clone ${REPO} ${APP.dir}
    fi
  `;
  const pullResult = await ssh.execCommand(cloneOrPull);
  if (pullResult.stdout) console.log(pullResult.stdout);
  if (pullResult.stderr) console.log(pullResult.stderr);
  ok('Repo tersedia di VPS: ' + APP.dir);

  // ── 2c. Install npm packages ──────────────────────────────────
  log('STEP 2c — npm install');
  await remote('npm install --legacy-peer-deps', 'npm install root');
  await remote('npm install --legacy-peer-deps', 'npm install backend');

  // ── 2d. Build backend ─────────────────────────────────────────
  log('STEP 2d — Build Backend (NestJS)');
  await ssh.execCommand('npm run build -w backend', { cwd: APP.dir })
    .then(r => { if (r.stdout) console.log(r.stdout); });
  ok('Backend berhasil di-build');

  // ── 2e. Build frontend & mobile ───────────────────────────────
  log('STEP 2e — Build Frontend');
  await ssh.execCommand('npm run build -w frontend', { cwd: APP.dir })
    .then(r => { if (r.stdout) console.log(r.stdout); });
  ok('Frontend berhasil di-build');

  log('STEP 2f — Build Mobile PWA');
  await ssh.execCommand('npm run build --prefix mobile', { cwd: APP.dir })
    .then(r => { if (r.stdout) console.log(r.stdout); });
  ok('Mobile PWA berhasil di-build');

  // ── 2g. Setup ecosystem PM2 & start ──────────────────────────
  log('STEP 2g — Setup PM2 & Start');

  // Upload ecosystem file ke VPS
  const ecosystem = generateEcosystem();
  await ssh.execCommand(`cat > ${APP.dir}/ecosystem.config.js << 'EOFPM2'\n${ecosystem}\nEOFPM2`);

  // Reload atau start PM2
  const pm2Check = await ssh.execCommand(`pm2 describe ${APP.pm2_name}`);
  if (pm2Check.code === 0) {
    await remote(`pm2 reload ${APP.pm2_name} --update-env`, 'pm2 reload');
  } else {
    await remote(`cd ${APP.dir} && pm2 start ecosystem.config.js`, 'pm2 start');
  }

  // Simpan PM2 agar restart otomatis saat VPS reboot
  await remote('pm2 save', 'pm2 save');
  await remote('pm2 startup', 'pm2 startup').catch(() => {});

  ok(`Backend berjalan dengan PM2: "${APP.pm2_name}"`);
  console.log('');
  const status = await ssh.execCommand('pm2 list');
  console.log(status.stdout);

  // ── 2h. Setup Nginx (jika belum ada) ─────────────────────────
  log('STEP 2h — Cek Nginx');
  const nginxCheck = await ssh.execCommand('nginx -v');
  if (nginxCheck.code !== 0) {
    console.log('   Nginx tidak terinstall, skip konfigurasi Nginx.');
  } else {
    const nginxConf = generateNginxConfig();
    await ssh.execCommand(`
      cat > /etc/nginx/sites-available/optik88 << 'EOFNGINX'
${nginxConf}
EOFNGINX
      ln -sf /etc/nginx/sites-available/optik88 /etc/nginx/sites-enabled/optik88
      nginx -t && systemctl reload nginx
    `);
    ok('Nginx dikonfigurasi dan di-reload');
  }

  ssh.dispose();
  console.log('\n\x1b[32m' + '═'.repeat(60) + '\x1b[0m');
  console.log('\x1b[32m  🚀  DEPLOY SELESAI!\x1b[0m');
  console.log(`\x1b[36m  Backend API  : http://${VPS.host}:3001\x1b[0m`);
  console.log(`\x1b[36m  Frontend     : http://${VPS.host}\x1b[0m`);
  console.log(`\x1b[36m  Mobile PWA   : http://${VPS.host}:5174\x1b[0m`);
  console.log('\x1b[32m' + '═'.repeat(60) + '\x1b[0m\n');
}

// ── Generate PM2 Ecosystem Config ─────────────────────────────
function generateEcosystem() {
  return `module.exports = {
  apps: [
    {
      name: '${APP.pm2_name}',
      script: 'dist/main.js',
      cwd: '${APP.dir}/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};`;
}

// ── Generate Nginx Config ──────────────────────────────────────
function generateNginxConfig() {
  return `server {
    listen 80;
    server_name ${VPS.host};

    # Frontend (Vite build)
    location / {
        root ${APP.dir}/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Mobile PWA
    location /mobile/ {
        root ${APP.dir}/mobile/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}`;
}

// ── MAIN ──────────────────────────────────────────────────────
(async () => {
  console.log('\n\x1b[35m' + '═'.repeat(60));
  console.log('  OPTIK88 — AUTO DEPLOY v1.0');
  console.log('  Target  : ' + VPS.host);
  console.log('  GitHub  : github.com/' + GH.username + '/' + GH.repo);
  console.log('═'.repeat(60) + '\x1b[0m\n');

  try {
    await pushToGithub();
    await deployToVPS();
  } catch (e) {
    err('Deploy gagal: ' + e.message);
    console.error(e);
    process.exit(1);
  }
})();
