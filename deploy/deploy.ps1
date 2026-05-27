# ===============================================================
#  deploy.ps1 — PowerShell wrapper untuk jalankan deploy
#  Cara   : .\deploy\deploy.ps1
#  Requires: Node.js, npm
# ===============================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ROOT = Split-Path $PSScriptRoot -Parent
$DEPLOY_DIR = "$ROOT\deploy"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Magenta
Write-Host "  OPTIK88 AUTO DEPLOY" -ForegroundColor Magenta
Write-Host "======================================================" -ForegroundColor Magenta

# ── Cek node-ssh sudah terinstall ────────────────────────────
Write-Host ""
Write-Host ">> Cek dependensi deploy..." -ForegroundColor Cyan
if (-not (Test-Path "$DEPLOY_DIR\node_modules\node-ssh")) {
    Write-Host "   Installing node-ssh..." -ForegroundColor Yellow
    Push-Location $DEPLOY_DIR
    npm install --save node-ssh
    Pop-Location
}
Write-Host "   node-ssh: OK" -ForegroundColor Green

# ── Cek secrets ada ──────────────────────────────────────────
if (-not (Test-Path "$DEPLOY_DIR\.secrets.json")) {
    Write-Host ""
    Write-Host "ERROR: File deploy\.secrets.json tidak ditemukan!" -ForegroundColor Red
    Write-Host "       Salin dari deploy\.secrets.example.json dan isi kredensial Anda." -ForegroundColor Yellow
    exit 1
}

# ── Jalankan deploy.js ────────────────────────────────────────
Write-Host ""
Write-Host ">> Menjalankan deploy script..." -ForegroundColor Cyan
node "$DEPLOY_DIR\deploy.js"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Green
    Write-Host "  DEPLOY BERHASIL!" -ForegroundColor Green
    Write-Host "======================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Deploy gagal! Periksa error di atas." -ForegroundColor Red
    exit 1
}
