#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Optik88 Quick Update - Deploy perubahan ke VPS

.DESCRIPTION
  Shortcut untuk menjalankan update.js dengan berbagai pilihan.
  Jalankan dari root folder optikbaru:
    .\update.ps1              -> update semua (frontend + backend + mobile)
    .\update.ps1 fe           -> hanya frontend
    .\update.ps1 be           -> hanya backend
    .\update.ps1 mob          -> hanya mobile
    .\update.ps1 fe,be        -> frontend + backend
    .\update.ps1 fe "pesan"   -> frontend dengan custom commit message
    .\update.ps1 all nopush   -> semua tapi skip git push

.EXAMPLE
  .\update.ps1
  .\update.ps1 fe
  .\update.ps1 be "fix: perbaikan checkout payment"
  .\update.ps1 fe,be
#>

param(
  [string]$Target  = "all",
  [string]$Message = "",
  [switch]$NoPush
)

# ── Map shorthand ke nama lengkap ────────────────────────────
$partMap = @{
  "all"      = "frontend,backend,mobile"
  "fe"       = "frontend"
  "front"    = "frontend"
  "frontend" = "frontend"
  "be"       = "backend"
  "back"     = "backend"
  "backend"  = "backend"
  "mob"      = "mobile"
  "mobile"   = "mobile"
  "pwa"      = "mobile"
  "fe,be"    = "frontend,backend"
  "be,fe"    = "frontend,backend"
  "fe,mob"   = "frontend,mobile"
  "be,mob"   = "backend,mobile"
}

$parts = if ($partMap.ContainsKey($Target)) { $partMap[$Target] } else { $Target }

# ── Build args ───────────────────────────────────────────────
$nodeArgs = @("deploy/update.js", "--only=$parts")
if ($Message -ne "") { $nodeArgs += "--message=$Message" }
if ($NoPush)         { $nodeArgs += "--skip-push" }

# ── Banner ───────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  🚀  OPTIK88 QUICK UPDATE" -ForegroundColor Magenta
Write-Host "  Target : $parts" -ForegroundColor Cyan
if ($Message) { Write-Host "  Pesan  : $Message" -ForegroundColor Cyan }
if ($NoPush)  { Write-Host "  Mode   : Skip Git Push" -ForegroundColor Yellow }
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""

# ── Jalankan ─────────────────────────────────────────────────
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

node @nodeArgs

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "  ✖  Update gagal! Cek error di atas." -ForegroundColor Red
  exit 1
}
