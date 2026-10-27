# LeadFlow CRM & Multichannel Lead Management Platform

A production-grade, multi-tenant Enterprise CRM and Lead Management Platform built from scratch with Next.js 15, TypeScript, Tailwind CSS, PostgreSQL 18, and Prisma ORM.

---

## 🌟 Key Features

1. **Centralized Customer & Lead Management**:
   - Complete lead data model with 30+ normalized fields (contact details, company, industry, geography, source attribution, qualification scores, custom fields, and communication preferences).
   - Server-side paginated tables and interactive Kanban boards with multi-attribute filtering (Status, Priority, Source, Owner) and full-text search.
   - Dedicated Lead Profile page with real-time status management, scoring breakdowns, scheduled tasks, and complete unified customer interaction timeline.

2. **Multichannel Lead Capture**:
   - Ingest leads from **Website Forms**, **WhatsApp Business**, **Twilio SMS**, **Telephony Calls**, and **Generic Webhooks**.
   - Public CORS-enabled lead capture endpoints with spam honeypot filters.
   - Interactive Communication Inbox with a live webhook sandbox simulator.

3. **Deterministic Lead Assignment Engine**:
   - Manual, Round-Robin, Least-Active Agent, Team Dispatch, and Fallback routing strategies.
   - Concurrency-safe pointer persistence preventing duplicate assignments.

4. **Visual Sales Pipeline & Opportunity Management**:
   - Customizable multi-stage sales pipeline with win probabilities and color codes.
   - Drag-and-drop or one-click stage progression with automatic win/loss timestamping.
   - Real-time pipeline forecasting: Total Open Pipeline, Weighted Value, Won Revenue, and Win Rate %.

5. **Automated Follow-ups, Tasks & Reminders**:
   - Tasks and reminders with priority ratings, due dates, and lead/deal linkage.
   - Visual monthly calendar view.
   - Dynamic alert indicators for overdue customer follow-ups.

6. **Lead Qualification Scoring Engine**:
   - Configurable scoring rules evaluated on lead creation and updates.
   - Granular, explainable scoring history logs.

7. **Transactional Lead Conversion**:
   - Controlled conversion of qualified leads into Contacts, Companies, and Deals.
   - Complete preservation of interaction history, notes, and original marketing attribution.

8. **Enterprise Security, RBAC & Compliance**:
   - Strict organization-level tenant isolation across all 23 database models.
   - Seven granular system roles: `OWNER`, `ADMIN`, `SALES_MANAGER`, `SALES_REP`, `MARKETING`, `SUPPORT`, `READ_ONLY`.
   - Immutable audit trail recording user actions, entity modifications, and exports.
   - **Spreadsheet Formula Injection (CSV Injection) Protection** on all CSV imports and exports.

9. **Analytics & Business Intelligence**:
   - Executive, Sales, and Marketing dashboard views powered by Recharts.
   - Sales representative leaderboard ranking team members by revenue, conversion rates, and client touches.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18.18+ or Node.js 20+ (tested on Node.js v24.14.1)
- PostgreSQL 14+ (tested on PostgreSQL 18.6)

### 2. Installation
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Push Prisma schema to PostgreSQL
npx prisma db push

# Seed realistic enterprise CRM data
node prisma/seed.js

# Run test suite
npm test

# Start Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

---

## 🔐 Demo Credentials

Quick-fill credentials on the login page:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Organization Owner** | `admin@acme.com` | `password123` |
| **Sales Manager** | `marcus.manager@acme.com` | `password123` |
| **Sales Representative** | `alex.rep@acme.com` | `password123` |
| **Sales Representative** | `elena.rodriguez@acme.com` | `password123` |
| **Marketing User** | `david.marketing@acme.com` | `password123` |

---

## 🧪 Testing & Verification

Run the automated test suite covering RBAC, CSV formula sanitization, lead qualification scoring, and pipeline analytics:

```bash
npm test
```

Run a production build check:
```bash
npm run build
```

---

## 📚 Documentation Deliverables

- [Architecture & System Design](docs/ARCHITECTURE.md)
- [REST API Documentation](docs/API_DOCUMENTATION.md)
- [Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Multichannel Integrations Guide](docs/INTEGRATIONS_GUIDE.md)
