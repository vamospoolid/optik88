#!/usr/bin/env node
/**
 * ============================================================
 *  OPTIK88 — Quick Update Script v1.0
 *  Khusus untuk update cepat setelah ada perubahan kode.
 *  Lebih cepat dari deploy.js penuh — tidak install ulang deps.
 *
 *  Cara pakai:
 *    node deploy/update.js                     → update semua
 *    node deploy/update.js --only=frontend     → hanya frontend
 *    node deploy/update.js --only=backend      → hanya backend
 *    node deploy/update.js --only=mobile       → hanya mobile
 *    node deploy/update.js --only=frontend,backend
 *    node deploy/update.js --skip-push         → skip git push
 *    node deploy/update.js --message="pesan"  → custom commit msg
 *
 *  Alur:
 *    1. git add + commit + push ke GitHub
 *    2. SSH ke VPS: git pull
 *    3. Build hanya bagian yang berubah
 *    4. PM2 reload (tanpa restart — zero downtime)
 * ============================================================
 */

const { execSync } = require('child_process');
const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');

// ── Parse args ────────────────────────────────────────────────
const args = process.argv.slice(2);
const SKIP_PUSH  = args.includes('--skip-push');
const ONLY_ARG   = args.find(a => a.startsWith('--only='));
const MSG_ARG    = args.find(a => a.startsWith('--message='));

const ONLY_PARTS = ONLY_ARG
  ? ONLY_ARG.replace('--only=', '').split(',').map(s => s.trim())
  : ['frontend', 'backend', 'mobile'];

const CUSTOM_MSG = MSG_ARG ? MSG_ARG.replace('--message=', '') : null;

// ── Config ────────────────────────────────────────────────────
const SECRETS_PATH = path.join(__dirname, '.secrets.json');
if (!fs.existsSync(SECRETS_PATH)) {
  console.error('❌  deploy/.secrets.json tidak ditemukan!');
  process.exit(1);
}
const cfg    = JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf-8'));
const VPS    = cfg.vps;
const GH     = cfg.github;
const APP    = cfg.app;
const ROOT   = path.join(__dirname, '..');
const BRANCH = 'main';

// ── Logger ────────────────────────────────────────────────────
const T = {
  reset:  '\x1b[0m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
  bold:   '\x1b[1m',
  magenta:'\x1b[35m',
};

const log  = (msg) => console.log(`\n${T.cyan}▶  ${msg}${T.reset}`);
const ok   = (msg) => console.log(`${T.green}✔  ${msg}${T.reset}`);
const warn = (msg) => console.log(`${T.yellow}⚠  ${msg}${T.reset}`);
const fail = (msg) => console.error(`${T.red}✖  ${msg}${T.reset}`);
const info = (msg) => console.log(`${T.gray}   ${msg}${T.reset}`);

const timer = () => {
  const start = Date.now();
  return () => `${((Date.now() - start) / 1000).toFixed(1)}s`;
};

// ── Git helpers ───────────────────────────────────────────────
function gitRun(cmd) {
  info(`$ ${cmd}`);
  return execSync(cmd, { cwd: ROOT, stdio: 'pipe' }).toString().trim();
}

function getChangedFiles() {
  try {
    const staged   = gitRun('git diff --name-only HEAD 2>/dev/null || echo ""');
    const unstaged = gitRun('git diff --name-only 2>/dev/null || echo ""');
    const untracked = gitRun('git ls-files --others --exclude-standard 2>/dev/null || echo ""');
    const all = [...staged.split('\n'), ...unstaged.split('\n'), ...untracked.split('\n')]
      .filter(Boolean);
    return all;
  } catch {
    return [];
  }
}

// ── STEP 1: Git Push ─────────────────────────────────────────
async function pushChanges() {
  log('STEP 1 — Git commit & push ke GitHub');
  const t = timer();

  // Cek ada perubahan tidak
  const changed = getChangedFiles();
  if (changed.length > 0) {
    info(`File berubah: ${changed.slice(0, 5).join(', ')}${changed.length > 5 ? ` ... +${changed.length - 5} lainnya` : ''}`);
  }

  const REPO_HTTPS = `https://${GH.token}@github.com/${GH.username}/${GH.repo}.git`;

  // Pastikan remote ada
  try {
    execSync('git remote remove origin', { cwd: ROOT, stdio: 'pipe' });
  } catch {}
  execSync(`git remote add origin ${REPO_HTTPS}`, { cwd: ROOT, stdio: 'pipe' });

  // Stage semua
  execSync('git add -A', { cwd: ROOT, stdio: 'pipe' });

  // Commit
  const now = new Date();
  const wib = new Date(now.getTime() + 8 * 3600 * 1000);
  const ts  = wib.toISOString().slice(0, 19).replace('T', ' ');
  const parts = ONLY_PARTS.join('+');
  const commitMsg = CUSTOM_MSG
    ? CUSTOM_MSG
    : `update(${parts}): ${ts} WIB`;

  try {
    execSync(`git commit -m "${commitMsg}"`, { cwd: ROOT, stdio: 'pipe' });
    ok(`Commit: "${commitMsg}"`);
  } catch {
    warn('Tidak ada perubahan baru untuk di-commit');
  }

  // Push
  try {
    execSync(`git push origin ${BRANCH}`, { cwd: ROOT, stdio: 'pipe' });
    ok(`Push → github.com/${GH.username}/${GH.repo} (${t()})`);
  } catch (e) {
    // Jika diverged, force push
    warn('Branch diverged, mencoba force push...');
    execSync(`git push origin ${BRANCH} --force`, { cwd: ROOT, stdio: 'pipe' });
    ok(`Force push berhasil (${t()})`);
  }
}

// ── STEP 2: VPS Update ────────────────────────────────────────
async function updateVPS() {
  log(`STEP 2 — Koneksi SSH ke VPS ${VPS.host}`);
  const t = timer();

  const ssh = new NodeSSH();
  await ssh.connect({
    host:         VPS.host,
    port:         VPS.port || 22,
    username:     VPS.username,
    password:     VPS.password,
    readyTimeout: 30000,
  });
  ok(`SSH terhubung (${t()})`);

  // Helper eksekusi remote
  const remote = async (cmd, label = '') => {
    const displayCmd = cmd.replace(/\n/g, ' ').trim().slice(0, 80);
    info(`[VPS] ${displayCmd}${cmd.length > 80 ? '...' : ''}`);
    const res = await ssh.execCommand(cmd, { cwd: APP.dir });
    if (res.stdout && res.stdout.trim()) {
      res.stdout.trim().split('\n').slice(-5).forEach(l => info(`  ${l}`));
    }
    if (res.stderr && res.code !== 0 && res.stderr.trim()) {
      res.stderr.trim().split('\n').slice(-3).forEach(l =>
        console.log(`${T.yellow}  ! ${l}${T.reset}`)
      );
    }
    return res;
  };

  // ─ 2a. Git pull ──────────────────────────────────────────
  log('STEP 2a — Pull kode terbaru dari GitHub');
  const t2a = timer();
  const REPO_URL = GH.token && GH.token !== 'PASTE_GITHUB_TOKEN_DI_SINI'
    ? `https://${GH.token}@github.com/${GH.username}/${GH.repo}.git`
    : `https://github.com/${GH.username}/${GH.repo}.git`;

  await remote(`
    cd ${APP.dir}
    if [ -d .git ]; then
      git fetch origin ${BRANCH} 2>&1
      git reset --hard origin/${BRANCH} 2>&1
    else
      git clone ${REPO_URL} ${APP.dir} 2>&1
    fi
  `, 'git pull');
  ok(`Git pull selesai (${t2a()})`);

  // ─ 2b. Build bagian yang diminta ─────────────────────────
  const buildFrontend = ONLY_PARTS.includes('frontend');
  const buildBackend  = ONLY_PARTS.includes('backend');
  const buildMobile   = ONLY_PARTS.includes('mobile');

  if (buildBackend) {
    log('STEP 2b — Build Backend (NestJS)');
    const tb = timer();
    await remote(`
      cd ${APP.dir}/backend
      npm install --legacy-peer-deps --silent 2>&1 | tail -3
      npm run build 2>&1 | tail -15
    `, 'build backend');
    ok(`Backend direbuild (${tb()})`);
  }

  if (buildFrontend) {
    log('STEP 2c — Build Frontend (Vite)');
    const tf = timer();
    await remote(`
      cd ${APP.dir}/frontend
      npm install --legacy-peer-deps --silent 2>&1 | tail -3
      npm run build 2>&1 | tail -15
    `, 'build frontend');
    ok(`Frontend direbuild (${tf()})`);
  }

  if (buildMobile) {
    log('STEP 2d — Build Mobile PWA');
    const tm = timer();
    await remote(`
      cd ${APP.dir}/mobile
      npm install --legacy-peer-deps --silent 2>&1 | tail -3
      npm run build 2>&1 | tail -15
    `, 'build mobile');
    ok(`Mobile PWA direbuild (${tm()})`);
  }

  // ─ 2e. PM2 Reload (zero-downtime) ────────────────────────
  if (buildBackend) {
    log('STEP 2e — PM2 Reload (zero-downtime)');
    const tp = timer();
    const pm2Check = await remote(`pm2 describe ${APP.pm2_name} 2>/dev/null | grep -c "online" || echo "0"`, 'pm2 check');
    const isOnline = pm2Check.stdout?.trim() === '1';

    if (isOnline) {
      await remote(`pm2 reload ${APP.pm2_name} --update-env 2>&1`, 'pm2 reload');
      ok(`PM2 reload (zero-downtime) selesai (${tp()})`);
    } else {
      await remote(`cd ${APP.dir} && pm2 start ecosystem.config.js 2>&1`, 'pm2 start');
      ok(`PM2 start selesai (${tp()})`);
    }
    await remote('pm2 save 2>&1', 'pm2 save');
  }

  // ─ 2f. Reload Nginx jika frontend/mobile berubah ─────────
  if (buildFrontend || buildMobile) {
    await remote('nginx -t 2>&1 && systemctl reload nginx 2>&1', 'nginx reload');
    ok('Nginx di-reload');
  }

  // ─ Summary ───────────────────────────────────────────────
  const pm2List = await remote('pm2 list --no-color 2>&1', 'pm2 list');

  ssh.dispose();

  const total = t();
  console.log('');
  console.log(`${T.green}${T.bold}${'═'.repeat(62)}${T.reset}`);
  console.log(`${T.green}${T.bold}  🚀  UPDATE BERHASIL! (Total: ${total})${T.reset}`);
  console.log(`${T.green}${'─'.repeat(62)}${T.reset}`);
  console.log(`${T.cyan}  Part diupdate : ${ONLY_PARTS.join(', ')}${T.reset}`);
  console.log(`${T.cyan}  Frontend      → http://optik.codenusa.id${T.reset}`);
  console.log(`${T.cyan}  Mobile PWA    → http://optik.codenusa.id/m/${T.reset}`);
  console.log(`${T.cyan}  API           → http://optik.codenusa.id/api/${T.reset}`);
  console.log(`${T.cyan}  GitHub        → https://github.com/${GH.username}/${GH.repo}${T.reset}`);
  console.log(`${T.green}${'═'.repeat(62)}${T.reset}\n`);
}

// ── MAIN ──────────────────────────────────────────────────────
(async () => {
  const tTotal = timer();

  console.log(`\n${T.magenta}${T.bold}${'═'.repeat(62)}`);
  console.log(`  OPTIK88 QUICK UPDATE`);
  console.log(`  Target  : ${ONLY_PARTS.join(', ')}`);
  console.log(`  VPS     : ${VPS.host}`);
  console.log(`  GitHub  : github.com/${GH.username}/${GH.repo}`);
  if (SKIP_PUSH) console.log(`  Mode    : skip-push (langsung VPS)`);
  console.log(`${'═'.repeat(62)}${T.reset}\n`);

  try {
    if (!SKIP_PUSH) {
      await pushChanges();
    } else {
      warn('--skip-push: Git push dilewati, langsung update VPS');
    }

    await updateVPS();

  } catch (e) {
    fail('Update gagal: ' + e.message);
    console.error(e.stack || e);
    process.exit(1);
  }
})();
