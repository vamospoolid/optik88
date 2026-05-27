const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  // Read secrets
  const secretsPath = path.join(__dirname, '.secrets.json');
  if (!fs.existsSync(secretsPath)) {
    console.error('❌ .secrets.json tidak ditemukan di folder deploy!');
    process.exit(1);
  }

  const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
  const { username, repo, token } = secrets.github;

  if (!username || !repo || !token) {
    console.error('❌ Kredensial GitHub tidak lengkap di .secrets.json!');
    process.exit(1);
  }

  // Get commit message from args
  const commitMessage = process.argv[2] || 'Auto commit update dari script node';

  console.log('🔄 Menyiapkan proses push ke GitHub...');

  // Ensure git is initialized
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch (e) {
    console.log('📦 Menginisialisasi repositori Git lokal...');
    execSync('git init', { stdio: 'inherit' });
  }

  // Remove existing origin if any
  try {
    execSync('git remote remove origin', { stdio: 'ignore' });
  } catch (e) {
    // Ignore error if origin doesn't exist
  }

  // Add remote with token
  const remoteUrl = `https://${username}:${token}@github.com/${username}/${repo}.git`;
  execSync(`git remote add origin ${remoteUrl}`);
  console.log('✅ Remote origin diperbarui secara aman.');

  // Add all files
  console.log('📝 Staging files (git add .)...');
  execSync('git add .', { stdio: 'inherit' });

  // Commit
  console.log(`💾 Committing: "${commitMessage}"`);
  try {
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  } catch (e) {
    console.log('ℹ️ Tidak ada perubahan baru untuk di-commit.');
  }

  // Ensure main branch
  execSync('git branch -M main', { stdio: 'inherit' });

  // Push
  console.log('🚀 Mendorong (Push) kode ke GitHub...');
  execSync('git push -u origin main', { stdio: 'inherit' });

  console.log('🎉 Berhasil mem-push seluruh proyek ke GitHub!');
} catch (error) {
  console.error('❌ Terjadi kesalahan saat push ke GitHub:', error.message);
  process.exit(1);
}
