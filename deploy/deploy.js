#!/usr/bin/env node
/**
 * ============================================================
 *  OPTIK88 — Deploy Script v2
 *  1. Buat repo GitHub jika belum ada (via API)
 *  2. Push kode ke GitHub
 *  3. SSH ke VPS → Install → Build → PM2
 *
 *  Cara pakai:
 *    node deploy/deploy.js
 *    node deploy/deploy.js --skip-github   (skip push, langsung VPS)
 *    node deploy/deploy.js --skip-vps      (hanya push GitHub)
 * ============================================================
 */

const { execSync }    = require('child_process');
const { NodeSSH }     = require('node-ssh');
const https           = require('https');
const path            = require('path');
const fs              = require('fs');

// ── Args ──────────────────────────────────────────────────────
const args        = process.argv.slice(2);
const SKIP_GITHUB = args.includes('--skip-github');
const SKIP_VPS    = args.includes('--skip-vps');

// ── Load secrets ─────────────────────────────────────────────
const SECRETS_PATH = path.join(__dirname, '.secrets.json');
if (!fs.existsSync(SECRETS_PATH)) {
  console.error('❌  File deploy/.secrets.json tidak ditemukan!');
  console.error('    Buat dari deploy/.secrets.example.json dan isi kredensial.');
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf-8'));

const VPS    = cfg.vps;
const GH     = cfg.github;
const APP    = cfg.app;
const ROOT   = path.join(__dirname, '..');
const BRANCH = 'main';

// ── Helpers ───────────────────────────────────────────────────
const log  = (msg) => console.log(`\n\x1b[36m▶  ${msg}\x1b[0m`);
const ok   = (msg) => console.log(`\x1b[32m✔  ${msg}\x1b[0m`);
const warn = (msg) => console.log(`\x1b[33m⚠  ${msg}\x1b[0m`);
const err  = (msg) => console.error(`\x1b[31m✖  ${msg}\x1b[0m`);

const run = (cmd, cwd = ROOT) => {
  console.log(`   $ ${cmd}`);
  return execSync(cmd, { cwd, stdio: 'inherit' });
};

// ── GitHub API helper ─────────────────────────────────────────
const githubAPI = (method, endpoint, body = null) => new Promise((resolve, reject) => {
  const data = body ? JSON.stringify(body) : null;
  const opts = {
    hostname: 'api.github.com',
    path:     `/repos/${GH.username}/${GH.repo}${endpoint === '/' ? '' : endpoint}`.replace('/repos/', endpoint.startsWith('/user') ? '' : '/repos/'),
    method,
    headers: {
      'Authorization': `token ${GH.token}`,
      'User-Agent':    'optik88-deploy',
      'Content-Type':  'application/json',
      'Accept':        'application/vnd.github.v3+json',
      ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
    },
  };

  // Perbaiki path untuk endpoint user
  if (endpoint.startsWith('/user')) {
    opts.path = endpoint;
  } else {
    opts.path = `/repos/${GH.username}/${GH.repo}`;
  }

  const req = https.request(opts, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
      catch { resolve({ status: res.statusCode, data: body }); }
    });
  });
  req.on('error', reject);
  if (data) req.write(data);
  req.end();
});

const githubPost = (path, body) => new Promise((resolve, reject) => {
  const data = JSON.stringify(body);
  const opts = {
    hostname: 'api.github.com',
    path,
    method:   'POST',
    headers: {
      'Authorization': `token ${GH.token}`,
      'User-Agent':    'optik88-deploy',
      'Content-Type':  'application/json',
      'Accept':        'application/vnd.github.v3+json',
      'Content-Length': Buffer.byteLength(data),
    },
  };
  const req = https.request(opts, (res) => {
    let b = '';
    res.on('data', d => b += d);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, data: JSON.parse(b) }); }
      catch { resolve({ status: res.statusCode, data: b }); }
    });
  });
  req.on('error', reject);
  req.write(data);
  req.end();
});

const githubGet = (path) => new Promise((resolve, reject) => {
  const opts = {
    hostname: 'api.github.com',
    path,
    method:   'GET',
    headers: {
      'Authorization': `token ${GH.token}`,
      'User-Agent':    'optik88-deploy',
      'Accept':        'application/vnd.github.v3+json',
    },
  };
  const req = https.request(opts, (res) => {
    let b = '';
    res.on('data', d => b += d);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, data: JSON.parse(b) }); }
      catch { resolve({ status: res.statusCode, data: b }); }
    });
  });
  req.on('error', reject);
  req.end();
});

// ── STEP 1: Pastikan repo GitHub ada ─────────────────────────
async function ensureGithubRepo() {
  log('STEP 1a — Cek repo GitHub');

  if (!GH.token || GH.token === 'PASTE_GITHUB_TOKEN_DI_SINI') {
    warn('GitHub token tidak diset di .secrets.json');
    warn('Buka: https://github.com/settings/tokens/new → centang "repo" → paste token ke .secrets.json');
    warn('Skip pembuatan repo otomatis — pastikan repo sudah ada manual.');
    return;
  }

  const check = await githubGet(`/repos/${GH.username}/${GH.repo}`);
  if (check.status === 200) {
    ok(`Repo sudah ada: github.com/${GH.username}/${GH.repo}`);
    return;
  }

  log('STEP 1b — Repo belum ada, membuat repo baru...');
  const create = await githubPost('/user/repos', {
    name:        GH.repo,
    description: 'Optik88 POS & Clinical System',
    private:     false,
    auto_init:   false,
  });

  if (create.status === 201) {
    ok(`Repo berhasil dibuat: github.com/${GH.username}/${GH.repo}`);
  } else {
    throw new Error(`Gagal buat repo GitHub: ${JSON.stringify(create.data)}`);
  }

  // Tunggu sebentar agar GitHub selesai init
  await new Promise(r => setTimeout(r, 2000));
}

// ── STEP 2: Push ke GitHub ────────────────────────────────────
async function pushToGithub() {
  log('STEP 2 — Push kode ke GitHub');

  const REPO_HTTPS = `https://${GH.token}@github.com/${GH.username}/${GH.repo}.git`;

  const isGit = fs.existsSync(path.join(ROOT, '.git'));
  if (!isGit) {
    run('git init');
    ok('Git repo diinisialisasi');
  }

  // Set remote
  try {
    execSync('git remote remove origin', { cwd: ROOT, stdio: 'pipe' });
  } catch {}
  execSync(`git remote add origin ${REPO_HTTPS}`, { cwd: ROOT, stdio: 'pipe' });

  run('git add -A');

  const commitMsg = `deploy: ${new Date().toISOString().slice(0,19).replace('T',' ')}`;
  try {
    run(`git commit -m "${commitMsg}"`);
  } catch {
    ok('Tidak ada perubahan — skip commit');
  }

  run(`git branch -M ${BRANCH}`);
  run(`git push -u origin ${BRANCH} --force`);

  ok(`✓ Kode berhasil di-push → github.com/${GH.username}/${GH.repo}`);
}

// ── STEP 3: SSH Deploy ke VPS ─────────────────────────────────
async function deployToVPS() {
  log(`STEP 3 — Koneksi SSH ke VPS ${VPS.host}`);

  const ssh = new NodeSSH();
  await ssh.connect({
    host:         VPS.host,
    port:         VPS.port,
    username:     VPS.username,
    password:     VPS.password,
    readyTimeout: 30000,
  });
  ok('SSH terhubung ✓');

  const remote = async (cmd, label) => {
    console.log(`   [VPS] $ ${cmd.split('\n')[0].trim()}${cmd.includes('\n') ? '...' : ''}`);
    const res = await ssh.execCommand(cmd, { cwd: APP.dir });
    if (res.stdout) console.log(res.stdout);
    if (res.stderr && res.code !== 0) console.error('\x1b[33m' + res.stderr + '\x1b[0m');
    return res;
  };

  // ─ 3a. Install system deps ───────────────────────────────
  log('STEP 3a — Install sistem (Node.js, PM2, git, nginx)');
  await ssh.execCommand(`
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y -qq
    if ! command -v node &>/dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>&1
      apt-get install -y nodejs 2>&1
    fi
    if ! command -v pm2 &>/dev/null; then
      npm install -g pm2 --quiet 2>&1
    fi
    if ! command -v git &>/dev/null; then
      apt-get install -y git 2>&1
    fi
    if ! command -v nginx &>/dev/null; then
      apt-get install -y nginx 2>&1
      systemctl enable nginx
      systemctl start nginx
    fi
    echo "node: $(node -v) | npm: $(npm -v) | pm2: $(pm2 -v) | git: $(git --version)"
  `).then(r => { if (r.stdout) console.log('  ', r.stdout.trim()); });
  ok('Sistem siap');

  // ─ 3b. Clone atau Pull ───────────────────────────────────
  log('STEP 3b — Clone / Pull repo dari GitHub');
  const REPO_URL = GH.token && GH.token !== 'PASTE_GITHUB_TOKEN_DI_SINI'
    ? `https://${GH.token}@github.com/${GH.username}/${GH.repo}.git`
    : `https://github.com/${GH.username}/${GH.repo}.git`;

  await ssh.execCommand(`
    if [ -d "${APP.dir}/.git" ]; then
      cd ${APP.dir} && git pull origin ${BRANCH} 2>&1
    else
      mkdir -p ${APP.dir}
      git clone ${REPO_URL} ${APP.dir} 2>&1
    fi
  `).then(r => {
    if (r.stdout) console.log(r.stdout.trim());
    if (r.stderr && !r.stderr.includes('Already up to date')) console.log(r.stderr.trim());
  });
  ok(`Repo siap di VPS: ${APP.dir}`);

  // ─ 3c. Install packages ──────────────────────────────────
  log('STEP 3c — npm install');
  await remote('npm install --legacy-peer-deps 2>&1 | tail -5', 'root install');
  ok('npm install selesai');

  // ─ 3d. Build Backend ─────────────────────────────────────
  log('STEP 3d — Build Backend NestJS');
  await remote('cd backend && npm install --legacy-peer-deps 2>&1 | tail -3 && npm run build 2>&1 | tail -10', 'build backend');
  ok('Backend built');

  // ─ 3e. Build Frontend ────────────────────────────────────
  log('STEP 3e — Build Frontend (Vite)');
  await remote('cd frontend && npm install --legacy-peer-deps 2>&1 | tail -3 && npm run build 2>&1 | tail -10', 'build frontend');
  ok('Frontend built');

  // ─ 3f. Build Mobile PWA ──────────────────────────────────
  log('STEP 3f — Build Mobile PWA');
  await remote('cd mobile && npm install --legacy-peer-deps 2>&1 | tail -3 && npm run build 2>&1 | tail -10', 'build mobile');
  ok('Mobile PWA built');

  // ─ 3g. PM2 Setup & Start ─────────────────────────────────
  log('STEP 3g — Setup PM2 Ecosystem');
  const ecosystem = `module.exports = {
  apps: [{
    name: '${APP.pm2_name}',
    script: './dist/main.js',
    cwd: '${APP.dir}/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '400M',
    env: { NODE_ENV: 'production', PORT: 3001 },
  }],
};`;

  await remote(`cat > ${APP.dir}/ecosystem.config.js << 'EOF'\n${ecosystem}\nEOF`, 'write ecosystem');
  
  const pm2Status = await remote(`pm2 describe ${APP.pm2_name} 2>/dev/null; echo $?`, 'pm2 check');
  const isRunning = pm2Status.stdout?.includes('online') || pm2Status.stdout?.includes('stopped');

  if (isRunning) {
    await remote(`pm2 reload ${APP.pm2_name} --update-env 2>&1`, 'pm2 reload');
    ok('PM2 app di-reload');
  } else {
    await remote(`cd ${APP.dir} && pm2 start ecosystem.config.js 2>&1`, 'pm2 start');
    ok('PM2 app dijalankan');
  }

  await remote('pm2 save 2>&1', 'pm2 save');
  await remote('pm2 startup 2>&1 | tail -3', 'pm2 startup').catch(() => {});

  // ─ 3h. Nginx Config ──────────────────────────────────────
  log('STEP 3h — Konfigurasi Nginx');
  const nginxConf = `server {
    listen 80 default_server;
    server_name ${VPS.host} _;

    # Frontend Desktop App
    root ${APP.dir}/frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Mobile PWA — akses via /m/
    location /m/ {
        alias ${APP.dir}/mobile/dist/;
        try_files $uri $uri/ /m/index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}`;

  await remote(`
    cat > /etc/nginx/sites-available/optik88 << 'EOFNGINX'
${nginxConf}
EOFNGINX
    rm -f /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/optik88 /etc/nginx/sites-enabled/optik88
    nginx -t 2>&1 && systemctl reload nginx 2>&1
  `, 'nginx config');
  ok('Nginx dikonfigurasi & di-reload');

  // ─ 3i. Status akhir ──────────────────────────────────────
  console.log('');
  const status = await remote('pm2 list 2>&1', 'pm2 status');

  ssh.dispose();

  console.log('\n\x1b[32m' + '═'.repeat(60) + '\x1b[0m');
  console.log('\x1b[32m  🚀  DEPLOY BERHASIL!\x1b[0m');
  console.log(`\x1b[36m  Frontend   → http://${VPS.host}\x1b[0m`);
  console.log(`\x1b[36m  Mobile PWA → http://${VPS.host}/m/\x1b[0m`);
  console.log(`\x1b[36m  API        → http://${VPS.host}/api/\x1b[0m`);
  console.log(`\x1b[36m  API Direct → http://${VPS.host}:3001\x1b[0m`);
  console.log(`\x1b[36m  GitHub     → https://github.com/${GH.username}/${GH.repo}\x1b[0m`);
  console.log('\x1b[32m' + '═'.repeat(60) + '\x1b[0m\n');
}

// ── MAIN ──────────────────────────────────────────────────────
(async () => {
  console.log('\n\x1b[35m' + '═'.repeat(60));
  console.log('  OPTIK88 AUTO DEPLOY v2.0');
  console.log(`  VPS     : ${VPS.host}`);
  console.log(`  GitHub  : github.com/${GH.username}/${GH.repo}`);
  console.log(`  App dir : ${APP.dir}`);
  console.log('═'.repeat(60) + '\x1b[0m\n');

  try {
    if (!SKIP_GITHUB) {
      await ensureGithubRepo();
      await pushToGithub();
    } else {
      warn('--skip-github: push GitHub dilewati');
    }

    if (!SKIP_VPS) {
      await deployToVPS();
    } else {
      warn('--skip-vps: deploy VPS dilewati');
    }
  } catch (e) {
    err('Deploy gagal: ' + e.message);
    console.error(e.stack || e);
    process.exit(1);
  }
})();
