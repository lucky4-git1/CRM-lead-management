# LeadFlow CRM — Production Deployment & Operations Guide

## 1. Prerequisites

- **Node.js**: v18.18+ or v20+ LTS (or v24)
- **PostgreSQL**: Version 14+ (Tested and verified on PostgreSQL 18.6)
- **Docker & Docker Compose** (Optional, for containerized deployment)

---

## 2. Local Setup & Verification

1. **Clone & Install Dependencies**:
   ```bash
   cd d:\CRM-lead-management-source
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crm_db?schema=public"
   JWT_SECRET="production-crm-jwt-secret-key-super-secure-change-in-real-prod-2026"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

3. **Synchronize Database Schema**:
   ```bash
   npx prisma db push
   ```

4. **Seed Demonstration Data**:
   Populate the database with sample organizations, pipelines, deals, leads, tasks, and scoring rules:
   ```bash
   node prisma/seed.js
   ```

5. **Run the Automated Test Suite**:
   ```bash
   npm test
   ```

6. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 3. Production Deployment with Docker Compose

To deploy LeadFlow CRM and a managed PostgreSQL instance using Docker:

```bash
docker-compose up -d --build
```

The stack exposes:
- Web Application: `http://your-server-ip:3000`
- PostgreSQL: `5432` (internal network isolation recommended)

---

## 4. Default Seed Credentials

For evaluation and initial system setup:

| Account | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Organization Owner** | `admin@acme.com` | `password123` | `OWNER` |
| **Sales Manager** | `marcus.manager@acme.com` | `password123` | `SALES_MANAGER` |
| **Sales Rep 1** | `alex.rep@acme.com` | `password123` | `SALES_REP` |
| **Sales Rep 2** | `elena.rodriguez@acme.com` | `password123` | `SALES_REP` |
| **Marketing User** | `david.marketing@acme.com` | `password123` | `MARKETING` |

---

## 5. Security & Production Checklist

1. **Change JWT Secret**: Ensure `JWT_SECRET` in `.env` is a high-entropy 256-bit random string.
2. **Database Backups**:
   ```bash
   # Scheduled backup job
   pg_dump -U postgres -Fc crm_db > /backups/crm_db_$(date +%Y%m%d_%H%M%S).dump
   ```
3. **Database Restore**:
   ```bash
   pg_restore -U postgres -d crm_db -c /backups/crm_db_backup.dump
   ```
4. **Rate Limiting & Reverse Proxy**: Place Nginx, Cloudflare, or AWS ALB in front of the application to manage SSL termination, HTTP/2, and rate limiting on `/api/public/capture/*`.
5. **Spreadsheet Formula Injection**: Verified and protected via `src/lib/csv-handler.ts`.
