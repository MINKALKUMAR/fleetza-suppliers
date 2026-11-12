# Fast Deployment Guide: Hostinger VPS (`supplier.fleetza.in`)

This application is **100% website-only** with a mobile-responsive UI, cross-platform **PWA (Installable App)**, and **₹0 Web Push (VAPID)** background notifications (no Play Store, no App Store, no Firebase, no paid SMS/WhatsApp API).

Because you may already run `fuel.fleetza.in` on port `8080` with `/etc/fleetza/fleetza.env` on the same Hostinger VPS (**`187.127.176.189`**), these configs isolate `supplier.fleetza.in` on **`127.0.0.1:8081`** and **`/etc/fleetza/supplier.env`** so nothing collides.

---

## 1. Point DNS for `supplier.fleetza.in` (Hostinger hPanel)

In **Hostinger hPanel → Domains → `fleetza.in` → DNS / Nameservers → DNS Records**:
- Save the **`A` record**:
  - **Type**: `A`
  - **Name**: `supplier`
  - **Value / Points to**: `187.127.176.189`
  - **TTL**: `300`

*(Wait ~2–5 minutes after saving and confirm `dig +short supplier.fleetza.in` returns `187.127.176.189` before running Certbot.)*

---

## 2. GitHub Repository (`https://github.com/fleetza180625/supplier.git`)

Repository URL:
`https://github.com/fleetza180625/supplier.git`

*(Note: Real production secrets like MySQL passwords, `JWT_SECRET`, and `VAPID_PRIVATE_KEY` are never stored in Git — they live only inside `/etc/fleetza/supplier.env` on the VPS.)*

---

## 3. One-Time VPS Preparation (`ssh root@187.127.176.189`)

SSH into your Hostinger VPS and verify/install Java 17, Maven, Node 20+, MySQL, Nginx, Certbot, and Git (most are likely already installed for `fuel.fleetza.in`):

```bash
sudo apt update
sudo apt install -y openjdk-17-jdk maven nginx mysql-server certbot python3-certbot-nginx git
# If `node -v` is below v18:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Create the MySQL Database & User (Choose One Option)

**Option A (Recommended — dedicated MySQL user for `fleetza_suppliers`):**
Log into MySQL as `root` (when prompted for password, enter your existing VPS MySQL password):
```bash
mysql -u root -p -e "
CREATE DATABASE IF NOT EXISTS fleetza_suppliers CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'fleetza_supplier'@'localhost' IDENTIFIED BY 'CHOOSE_STRONG_DB_PASSWORD';
GRANT ALL PRIVILEGES ON fleetza_suppliers.* TO 'fleetza_supplier'@'localhost';
FLUSH PRIVILEGES;
"
```

**Option B (Reuse existing MySQL `root` user on the VPS):**
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS fleetza_suppliers CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```
*(If using Option B, set `DB_USERNAME=root` and your MySQL root password as `DB_PASSWORD=` in `/etc/fleetza/supplier.env`.)*

### Clone or Upload the Repository on the VPS
```bash
sudo mkdir -p "/var/www/Fleetza Private Limited"
sudo git clone https://github.com/fleetza180625/supplier.git "/var/www/Fleetza Private Limited/Supplier"
```
*(If `fleetza180625/supplier` is private on GitHub, enter your GitHub username + a Personal Access Token when prompted, or upload directly to `/var/www/Fleetza Private Limited/Supplier`.)*

---

## 4. Generate Free VAPID Keys & Create `/etc/fleetza/supplier.env`

Generate your free permanent Web Push VAPID keys + a 64-character `JWT_SECRET`:

```bash
cd "/var/www/Fleetza Private Limited/Supplier"
node deploy/generate-vapid-keys.mjs
openssl rand -hex 32
```

Create `/etc/fleetza/supplier.env` (without touching `/etc/fleetza/fleetza.env`):

```bash
sudo mkdir -p /etc/fleetza
sudo cp "/var/www/Fleetza Private Limited/Supplier/deploy/fleetza.env.example" /etc/fleetza/supplier.env
sudo chown root:root /etc/fleetza/supplier.env
sudo chmod 600 /etc/fleetza/supplier.env
sudo nano /etc/fleetza/supplier.env
```

Fill in these values inside `/etc/fleetza/supplier.env`:
- `PORT=8081` (already set; change only if `8081` is already occupied on your VPS)
- `DB_USERNAME=` `fleetza_supplier` (for Option A) or `root` (for Option B)
- `DB_PASSWORD=` your MySQL password
- `ADMIN_INITIAL_PASSWORD=` initial password for login user `admin` (default `Admin@12345` — or log in with `Admin@12345` and change immediately at `/change-password`)
- `JWT_SECRET=` the 64-char output of `openssl rand -hex 32`
- `VAPID_PUBLIC_KEY=` and `VAPID_PRIVATE_KEY=` from `node deploy/generate-vapid-keys.mjs`

---

## 5. Build, Start Backend Service, Enable Nginx & Issue HTTPS SSL

```bash
cd "/var/www/Fleetza Private Limited/Supplier"
sudo bash deploy/deploy-vps.sh
sudo certbot --nginx -d supplier.fleetza.in --non-interactive --agree-tos -m admin@fleetza.in
```

Verify backend + database + Web Push VAPID status:
```bash
curl -s https://supplier.fleetza.in/api/health
```
Confirm `"status":"UP"`, `"database":"UP"`, and `"webPushVapidConfigured":true`.

First login on **`https://supplier.fleetza.in`**:
- **Username**: `admin`
- **Password**: value of `ADMIN_INITIAL_PASSWORD` in `/etc/fleetza/supplier.env` (`Admin@12345` by default — change immediately at `/change-password` after logging in).

---

## 6. Fast Future Updates (1 Command)

Whenever you push new commits:
```bash
cd "/var/www/Fleetza Private Limited/Supplier" && sudo git pull && sudo bash deploy/deploy-vps.sh
```
