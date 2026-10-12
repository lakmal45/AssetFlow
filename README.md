# AssetFlow: Resource Reservation Management System

> **Candidate Technical Assessment Submission**  
> **Organization:** PrimeWave Lab (Pvt) Ltd  
> **Assessment Title:** Resource Reservation Management System  
> **Tech Stack:** Next.js 16 (App Router), TypeScript, PostgreSQL, Prisma ORM, Tailwind CSS  
> **Repository:** [https://github.com/lakmal45/AssetFlow](https://github.com/lakmal45/AssetFlow)

---

## 1. Problem Statement & Business Solution

Growing organizations manage diverse shared resources—conference rooms, audio/video studios, specialized test hardware, and company vehicles. Manual records and informal communication cause:
- **Scheduling confusion** and overlapping bookings.
- **Lost productivity** from double-booked facilities.
- **Lack of operational visibility** into equipment utilization and maintenance downtime.

**AssetFlow** solves these challenges with an enterprise-grade web application featuring:
1. **Mathematical Collision Prevention:** Atomic PostgreSQL transaction locks ensuring zero double-bookings.
2. **Unified Resource Catalog:** Detailed categorization (Facilities, Equipment, Vehicles), capacity filters, and real-time status.
3. **Interactive Visual Timeline:** 12-hour continuous grid (08:00 AM – 08:00 PM) showing busy, active, and free slots with 1-click booking.
4. **Lifecycle Management:** Complete state workflow (`CONFIRMED` $\rightarrow$ `CHECKED_IN` $\rightarrow$ `COMPLETED` / `CANCELLED`).
5. **Servicing Lockouts:** Scheduled maintenance windows that automatically block user booking requests.
6. **Administrative Governance:** Asset CRUD, approval queue, utilization metrics, and audit logs.
7. **Instant Persona Switcher:** Built-in evaluation toolbar to switch between Admin, Manager, and Team Member roles with zero configuration.

---

## 2. System Architecture & Relational Design

### 2.1 Database Schema & ER Diagram
Full documentation and entity relationships can be reviewed in [docs/database_er_diagram.md](docs/database_er_diagram.md).

```mermaid
erDiagram
    DEPARTMENT ||--o{ USER : employs
    USER ||--o{ RESERVATION : books
    USER ||--o{ AUDIT_LOG : triggers
    RESOURCE_CATEGORY ||--o{ RESOURCE : categorizes
    RESOURCE ||--o{ RESERVATION : reserved_for
    RESOURCE ||--o{ MAINTENANCE_WINDOW : schedules
    RESERVATION ||--o{ AUDIT_LOG : records
```

### 2.2 Concurrency & Conflict Prevention Algorithm
AssetFlow prevents race conditions and scheduling collisions at the database transaction level:
- Two intervals $[S_1, E_1)$ and $[S_2, E_2)$ collide if:
  $$\text{Overlap Condition: } (S_1 < E_2) \land (E_1 > S_2)$$
- Creation requests run inside `prisma.$transaction`:
  1. Check for overlapping active reservations (`status NOT IN ('CANCELLED', 'REJECTED')`).
  2. Check for overlapping maintenance windows (`maintenance_windows`).
  3. Validate resource availability and duration bounds.
  4. Write reservation and immutable audit log entry in a single atomic commit.

Automated verification suite can be executed via `npm run test:conflict`.

---

## 3. Demo Personas (Pre-Seeded)

The top navigation bar includes an **Instant Persona Switcher** dropdown:

| Name | Role | Department | Purpose / Permissions |
| :--- | :--- | :--- | :--- |
| **Sarah Chen** | `ADMIN` | Operations & Facilities | Access Admin Console, resource CRUD, schedule lockouts, approvals, view audit logs. |
| **Marcus Vance** | `MANAGER` | Software Engineering | Team booking approvals and executive metrics. |
| **Alex Rivera** | `MEMBER` | Software Engineering | Standard booking, check-in to Dev Workstations & Boardrooms. |
| **Elena Rostova** | `MEMBER` | Product Design | Creative Lab bookings and reservation management. |

---

## 4. Getting Started & Local Setup

### Prerequisites
- **Node.js:** v18.x or v20.x+ (Recommended: Node 20+)
- **PostgreSQL:** v14+ (Local instance or cloud connection like Neon/Supabase)

### Step 1: Clone Repository
```bash
git clone https://github.com/lakmal45/AssetFlow.git
cd AssetFlow
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` and configure your PostgreSQL connection string:
```bash
cp .env.example .env
```
Example `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/assetflow_db?schema=public"
NEXT_PUBLIC_APP_NAME="AssetFlow"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 4: Synchronize Database Schema
```bash
npx prisma db push
```

### Step 5: Seed Sample Data
Populates 4 personas, 5 categories, 8 resources, sample bookings, and maintenance windows:
```bash
npm run seed
```

### Step 6: Run Automated Conflict Test Suite (Optional)
```bash
npm run test:conflict
```

### Step 7: Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 5. Key Application Routes

- `/` — **Resource Catalog & Directory:** Live search, category tabs, capacity filters, and reservation modals.
- `/timeline` — **Interactive Day Timeline:** 12-hour availability grid across all resources with click-to-book slots.
- `/reservations` — **My Bookings & Custody:** Member dashboard with on-site **Check-in**, **Check-out / Return Early**, and **Cancel** buttons.
- `/admin` — **Admin Console:** Resource management table, maintenance scheduler, approvals queue, audit trail, and utilization analytics.

---

## 6. Demonstration Video Script
A structured 3–5 minute demonstration recording walkthrough is detailed in [docs/demonstration_video_script.md](docs/demonstration_video_script.md).
