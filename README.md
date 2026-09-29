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

## 🏛️ Two Distinct Portals (Unified Architecture)

Fleetza is strictly organized into **TWO Dedicated Portals**:

1. **👑 Unified Operations Admin Panel (`/admin/...`)**:
   - Single central desk for dispatchers and fleet administrators.
   - Live Dispatch Desk, high-density fleet register, supplier quota management, and operations tracker.
   - Master city controls, supplier password resets, and real-time availability monitor.

2. **🚕 Fleet Supplier Portal (`/supplier/...`)**:
   - Mobile-first web app and installable PWA for taxi partners and vehicle operators.
   - 1-Tap direct availability toggles (`Available` / `Booked`).
   - High-decibel continuous siren alarm on incoming duty dispatches that loops until accepted or declined.

---

## 🔑 All System Login Accounts & Passwords (Quick Reference)

Log in at `http://localhost:5173/login`:

| Portal & Account | Full Name / Partner | Username | Password | Convenient Aliases | Portal Access URL |
|---|---|---|---|---|---|
| **👑 Operations Admin (Single Admin Panel)** | Fleetza Operations Admin (WhatsApp: `8264083932`) | `admin` | `Admin@12345` | `admin` or `admin123` | `/admin/dashboard` |
| **🚕 Supplier (Chandigarh)** | Rajinder Singh (Royal Cabs) | `supplier_demo` | `Supplier@12345` | `supplier` or `supplier123` | `/supplier/dashboard` |
| **🚕 Supplier (Ludhiana)** | Harpreet Singh (Dhillon Travels) | `ludhiana_fleet` | `Supplier@12345` | `supplier` or `supplier123` | `/supplier/dashboard` |
| **🚕 Supplier (Amritsar)** | Manpreet Kaur (Golden City) | `amritsar_cabs` | `Supplier@12345` | `supplier` or `supplier123` | `/supplier/dashboard` |

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
3. **Background & PWA Notifications**:
   - Service worker displays persistent notifications (`requireInteraction: true`, vibration: `[500, 200, 500, 200, 500]`).
   - Clicking notification directly focuses the Fleetza supplier app and triggers immediate duty banner view.
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

## 🚀 Going Live with MySQL Tomorrow

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
