# ===============================================================
#  vps-setup.sh — Jalankan SEKALI di VPS baru untuk persiapan
#  Cara: chmod +x vps-setup.sh && ./vps-setup.sh
# ===============================================================

set -e

echo ""
echo "======================================================"
echo "  OPTIK88 — VPS Initial Setup"
echo "======================================================"
echo ""

# ── 1. Update sistem ──────────────────────────────────────────
echo ">> [1/7] Update sistem..."
apt-get update -y && apt-get upgrade -y

# ── 2. Install Node.js 20 LTS ─────────────────────────────────
echo ">> [2/7] Install Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  echo "   Node.js: $(node -v)"
else
  echo "   Node.js sudah ada: $(node -v)"
fi

# ── 3. Install PM2 ────────────────────────────────────────────
echo ">> [3/7] Install PM2..."
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi
echo "   PM2: $(pm2 -v)"

# ── 4. Install Nginx ──────────────────────────────────────────
echo ">> [4/7] Install Nginx..."
if ! command -v nginx &> /dev/null; then
  apt-get install -y nginx
  systemctl enable nginx
  systemctl start nginx
  echo "   Nginx berhasil diinstall"
else
  echo "   Nginx sudah ada: $(nginx -v 2>&1)"
fi

# ── 5. Install git ────────────────────────────────────────────
echo ">> [5/7] Install Git..."
if ! command -v git &> /dev/null; then
  apt-get install -y git
fi
echo "   Git: $(git --version)"

# ── 6. Buat direktori app ─────────────────────────────────────
echo ">> [6/7] Persiapan direktori /var/www/optik88..."
mkdir -p /var/www/optik88
echo "   Direktori siap."

# ── 7. Setup firewall (UFW) ────────────────────────────────────
echo ">> [7/7] Setup Firewall (UFW)..."
if command -v ufw &> /dev/null; then
  ufw allow 22/tcp    # SSH
  ufw allow 80/tcp    # HTTP
  ufw allow 443/tcp   # HTTPS
  ufw allow 3001/tcp  # Backend API
  ufw --force enable
  ufw status
else
  echo "   UFW tidak tersedia, skip."
fi

echo ""
echo "======================================================"
echo "  VPS SETUP SELESAI!"
echo "  Sekarang jalankan: node deploy/deploy.js"
echo "======================================================"
echo ""
