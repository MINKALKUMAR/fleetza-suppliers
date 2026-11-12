# Fleetza - Taxi Supplier and Vehicle Management System

A full-stack enterprise web application designed for real-world taxi operations, managing suppliers, DCOs (Driver Cum Owners), fleet suppliers, vehicles, live availability, bookings, and duty assignment workflows.

---

## Architecture

- **Frontend**: React (Vite, JavaScript, JSX, React Router v6, Axios, Vanilla CSS / CSS Modules). *Zero TypeScript, zero Tailwind CSS.*
- **Backend**: Java 17, Spring Boot 3.2, Spring Security 6, JWT, Spring Data JPA, Hibernate, Bean Validation.
- **Database**: PostgreSQL (with Docker Compose & local installation support), H2 development profile fallback.

```
React (Vite)  ──►  REST API (/api/*)  ──►  Spring Boot Controllers
                                                   │
                                            Service Layer
                                                   │
                                            Spring Data JPA
                                                   │
                                            PostgreSQL / H2
                                             MySQL / PostgreSQL / H2
```

---

## 🏛️ Two Distinct Portals (Unified Website + PWA Architecture)

Fleetza is a **100% website-only** platform (installable PWA on Android, iOS Safari, and Windows/Mac desktops — zero Play Store, App Store, or Firebase dependencies) organized into **TWO Dedicated Portals**:

1. **👑 Unified Operations Admin Panel (`/admin/...`)**:
   - Single central desk for dispatchers and fleet administrators.
   - Live Dispatch Desk, high-density fleet register, supplier quota management, and operations tracker.
   - Master city controls, supplier password resets, and real-time availability monitor.

2. **🚕 Fleet Supplier Portal (`/supplier/...`)**:
   - Mobile-responsive web app and installable PWA for taxi partners and vehicle operators.
   - 1-Tap direct availability toggles (`Available` / `Booked`).
   - High-decibel continuous siren alarm on incoming duty dispatches plus **₹0 Web Push (VAPID)** background alerts.

---

## 🔑 Default Admin & Demo Accounts

**In Production (`mysql` profile — `https://supplier.fleetza.in/login`):**
- Only Roles, Master Cities, Master Vehicle Groups, and the `admin` account (`Admin@12345` or `ADMIN_INITIAL_PASSWORD` env var) are initialized on a fresh database (`SEED_DEMO_DATA=false`).
- Demo supplier accounts and sample bookings are **disabled in production** — change the `admin` password right after first login at `/change-password`.

**In Local Dev (`dev` profile — `SEED_DEMO_DATA=true`):**

| Portal & Account | Full Name / Partner | Username | Password | Portal Access URL |
|---|---|---|---|---|
| **👑 Operations Admin (Single Admin Panel)** | Fleetza Operations Admin (WhatsApp: `8264083932`) | `admin` | `Admin@12345` | `/admin/dashboard` |
| **🚕 Supplier (Chandigarh)** | Rajinder Singh (Royal Cabs) | `supplier_demo` | `Supplier@12345` | `/supplier/dashboard` |
| **🚕 Supplier (Ludhiana)** | Harpreet Singh (Dhillon Travels) | `ludhiana_fleet` | `Supplier@12345` | `/supplier/dashboard` |
| **🚕 Supplier (Amritsar)** | Manpreet Kaur (Golden City) | `amritsar_cabs` | `Supplier@12345` | `/supplier/dashboard` |

> [!TIP]
> **Admin Business WhatsApp & Support**:
> - Admin Business WhatsApp: **`+91 8264083932`** (`8264083932`).
> - Suppliers can tap the green **Admin Desk** button in their portal header or sidebar to start a direct WhatsApp chat with Operations Admin at any time.
> - Admin can change or reset any supplier's password at any time from the **Supplier Management** desk (`/admin/suppliers`) using the **Pass** button or inside **Edit & Quota**.
> - Changes are immediately saved in the backend database and take effect live.
> - Any logged-in supplier can also change their own password from the menu at `/change-password`.

---

## 🚨 Continuous Duty Alarm & Notification System

The core operational objective of Fleetza is to ensure taxi suppliers **never miss a dispatch**, even when their phone is in their pocket or Chrome is backgrounded:

1. **High-Decibel Siren Loop**:
   - Synthesizes an alternating electronic taxi siren (dual sawtooth/square sweeps: 1040Hz – 1380Hz – 680Hz) at 0.95 gain with audio dynamics compression.
   - In-memory 8-bit PCM WAV HTML5 audio loop ensures dual-engine playback on mobile speakers.
   - Alarm loops continuously **UNTIL the supplier explicitly clicks "ACCEPT DUTY" or "DECLINE"**.
2. **Device Vibration & Flashing Title**:
   - Pulses physical phone vibration (`[400ms, 200ms, 400ms, 200ms, 600ms]`) on every alarm burst.
   - Tab title flashes `🚨 URGENT: NEW DUTY ASSIGNED!` alternating with `⚡ FLEETZA ALARM RINGING!`.
3. **Background & Zero-Cost Web Push (VAPID) Notifications**:
   - Free forever (`₹0`) standards-based VAPID Web Push backed by Spring Boot + MySQL + Nginx HTTPS (Certbot), with zero Firebase/SMS/WhatsApp API costs.
   - Service worker (`public/sw.js`) displays persistent notifications (`requireInteraction: true`, vibration: `[500, 200, 500, 200, 500]`) even when the browser tab is closed or backgrounded.
   - Clicking a notification focuses the Fleetza portal and navigates straight to the active duty/alert view.
   - Installable PWA (`manifest.webmanifest`) on Android Chrome, Windows/Mac Edge & Chrome, and iOS 16.4+ Safari ("Add to Home Screen").
4. **Auto-Unblock Engine**:
   - Modern browsers suspend audio context until a touch/gesture occurs. Any touch anywhere on the screen (or the pulsing `TAP TO HEAR LOUD ALARM` button) instantly unblocks the audio engine.

---

## ⚡ Responsive "Dispatch Desk" (`/admin/requests`)

- **Slim Space-Saving Layout**: Eliminates large vertical gaps; combines city filters into an easy horizontal scroll track (`All Cities`, `Chandigarh`, `Ludhiana`, `Amritsar`).
- **2-Column Split Deck**:
  - *Left*: Live vehicle picker with instant search (`plate`, `name`, `supplier`) and `Ready` vs `Booked` filter chips.
  - *Right*: Quick duty dispatch form (`4h/40km`, `8h/80km`, `Outstation`, quick `Today`/`Tmrw` dates, `+30m`/`+1h` times).
- **1-Click WhatsApp & Portal Dispatch**: Dispatches live to supplier portal inbox and opens pre-filled WhatsApp message simultaneously.
- **Mobile Responsive**: On mobile viewports (<640px), converts into single-column vertical flow with full-width action buttons and optimized touch targets.

---

## 🚀 Deploying to Hostinger VPS (`supplier.fleetza.in`)

Full step-by-step instructions are in [DEPLOY_HOSTINGER_VPS.md](DEPLOY_HOSTINGER_VPS.md), including:
1. DNS `A` record (`supplier` -> `187.127.176.189`).
2. Generating free permanent VAPID keys with `node deploy/generate-vapid-keys.mjs` into `/etc/fleetza/supplier.env`.
3. One-command build & Nginx/systemd/Certbot HTTPS setup via `sudo bash deploy/deploy-vps.sh`.

Fleetza includes ready-to-use production MySQL support. To switch from dev (H2) to MySQL:

### 1. Create MySQL Database
```sql
CREATE DATABASE fleetza_suppliers CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Credentials
In `backend/src/main/resources/application-mysql.properties` (or via environment variables):
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/fleetza_suppliers?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata&createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
spring.jpa.hibernate.ddl-auto=update
```
*(Note: `ddl-auto=update` automatically generates and updates all necessary tables and relations on first start with zero data loss).*

### 3. Run Backend with MySQL Profile
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```
Or set environment variable:
- Windows PowerShell: `$env:SPRING_PROFILES_ACTIVE="mysql"; mvn spring-boot:run`
- Linux / Mac: `SPRING_PROFILES_ACTIVE=mysql mvn spring-boot:run`

### 4. Build & Serve Frontend
```bash
cd frontend
npm run build
```
*(The production build in `dist/` can be served with Nginx, Apache, or any static file server).*

## Development Phases

- **Phase 1**: Project Setup, PostgreSQL & Dev Fallback, Spring Security, JWT, Login, Roles, Protected Routes
- **Phase 2**: Master Data (Cities, Vehicle Types), Supplier Registration & Profile Completion
- **Phase 3**: Vehicle Management, Supplier Vehicle Dashboard, Live Status Workflow
- **Phase 4**: Customer Bookings, "Find Available Car" Search Engine, Duty Assignment
- **Phase 5**: Duty Request Dispatch, Supplier Accept/Reject Workflow, In-App Notifications
- **Phase 6**: Admin City-wise Availability Dashboard, Supplier Performance Summaries
- **Phase 7**: Reports, Document Expiry Tracking, Audit Logging & Status History
- **Phase 8**: Production Polish, Verification & Deployment
