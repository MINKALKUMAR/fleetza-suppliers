#!/usr/bin/env bash
set -euo pipefail

# Fast One-Command Build & Deploy Script on Hostinger VPS
# Run from the repository root directory on your VPS:
#   sudo bash deploy/deploy-vps.sh

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="/opt/fleetza-supplier"
WEB_DIR="/var/www/supplier.fleetza.in"
ENV_FILE="/etc/fleetza/supplier.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: Missing $ENV_FILE. Copy deploy/fleetza.env.example to $ENV_FILE and fill real secrets first."
  exit 1
fi

if grep -Eq "REPLACE_WITH_|CHANGE_ME_" "$ENV_FILE"; then
  echo "ERROR: $ENV_FILE still contains REPLACE_WITH_ or CHANGE_ME_ placeholders. Edit it before deploying."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
APP_PORT="${PORT:-8081}"

echo "==> [1/5] Building Frontend (React + Vite PWA)..."
cd "$REPO_DIR/frontend"
npm ci --no-audit --no-fund
npm run build

echo "==> [2/5] Publishing Frontend to $WEB_DIR..."
mkdir -p "$WEB_DIR"
rm -rf "$WEB_DIR"/*
cp -r "$REPO_DIR/frontend/dist/"* "$WEB_DIR/"
chown -R www-data:www-data "$WEB_DIR"

echo "==> [3/5] Building Backend JAR (Spring Boot + Web Push VAPID)..."
cd "$REPO_DIR/backend"
mvn clean package -DskipTests
mkdir -p "$APP_DIR"
cp "$REPO_DIR/backend/target/suppliers-1.0.0.jar" "$APP_DIR/app.jar"
chown -R www-data:www-data "$APP_DIR"

echo "==> [4/5] Syncing systemd unit & Nginx site config..."
cp "$REPO_DIR/deploy/fleetza-supplier.service" /etc/systemd/system/fleetza-supplier.service
systemctl daemon-reload
systemctl enable fleetza-supplier
if [ ! -f /etc/nginx/sites-available/supplier.fleetza.in ]; then
  cp "$REPO_DIR/deploy/nginx-supplier.fleetza.in.conf" /etc/nginx/sites-available/supplier.fleetza.in
fi
ln -sf /etc/nginx/sites-available/supplier.fleetza.in /etc/nginx/sites-enabled/supplier.fleetza.in

echo "==> [5/5] Restarting Backend Service, Verifying Health & Reloading Nginx..."
systemctl restart fleetza-supplier
nginx -t && systemctl reload nginx

echo "Waiting for backend on http://127.0.0.1:${APP_PORT}/api/health ..."
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null 2>&1; then
    echo ""
    curl -s "http://127.0.0.1:${APP_PORT}/api/health"
    echo ""
    echo "Deployment complete!"
    echo "Check backend logs : journalctl -u fleetza-supplier -f"
    echo "Public check       : curl -s https://supplier.fleetza.in/api/health"
    exit 0
  fi
  sleep 1
done

echo "ERROR: Backend did not respond healthy on 127.0.0.1:${APP_PORT} within 30 seconds."
journalctl -u fleetza-supplier -n 50 --no-pager
exit 1

