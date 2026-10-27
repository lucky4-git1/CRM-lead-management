# LeadFlow CRM — Architecture & System Design Documentation

## 1. System Overview

LeadFlow CRM is an enterprise-grade, multi-tenant CRM and lead management platform designed for modern sales teams, operations departments, and marketing teams handling high-volume lead pipelines across diverse channels.

```
+-----------------------------------------------------------------------------------+
|                                  USER / CLIENTS                                   |
|   (Desktop Browser, Tablet, Mobile, Embeddable Forms, WhatsApp, SMS, Webhooks)    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           NEXT.JS FULL-STACK MONOLITH                             |
|                                                                                   |
|  +---------------------------+  +-----------------------------------------------+ |
|  |     FRONTEND LAYER        |  |                 API LAYER                     | |
|  | - Next.js App Router      |  | - /api/auth/* (JWT + bcrypt + RBAC)           | |
|  | - Tailwind CSS & Lucide   |  | - /api/leads/* (CRUD, Import, Export, Convert)| |
|  | - Recharts Intelligence   |  | - /api/deals/* (Kanban Pipeline & Stages)     | |
|  | - Real-time Action Modals |  | - /api/tasks/* (Reminders & Follow-ups)       | |
|  +---------------------------+  | - /api/public/capture/* (CORS & Honeypot)     | |
|                                 | - /api/webhooks/* (WhatsApp, Twilio, Generic) | |
|                                 +-----------------------------------------------+ |
|                                                         |                         |
|  +------------------------------------------------------+                         |
|  v                                                                                |
|  +------------------------------------------------------------------------------+ |
|  |                            CORE BUSINESS ENGINES                             | |
|  |  1. Lead Scoring Engine (Deterministic criteria & explainable scoring logs)   | |
|  |  2. Assignment Engine (Round-robin, least-active rep, team routing, fallback)| |
|  |  3. Automation Engine (Triggers: Created, Stage Move, Deal Won; Auto-tasks)  | |
|  |  4. Conversion Engine (Transactional Lead -> Contact + Company + Deal)       | |
|  |  5. CSV Security Engine (Spreadsheet formula injection sanitization)         | |
|  |  6. Multichannel Ingestion Adapters (WhatsApp Cloud API, Twilio, Telephony)  | |
|  +------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                 PERSISTENCE LAYER                                 |
|                         PostgreSQL 18 via Prisma ORM                             |
|  - 23 Normalized Relational Tables with Foreign Keys, Cascades & Unique Indexes   |
|  - Tenant-Scoped Isolation (organizationId) on every customer record             |
|  - Immutable Audit Logging for Security and Compliance                           |
+-----------------------------------------------------------------------------------+
```

---

## 2. Multi-Tenant Architecture & Tenant Isolation

Every customer entity (`Lead`, `Contact`, `Company`, `Deal`, `Task`, `Interaction`, `AutomationRule`, `LeadAssignmentRule`, `LeadScoringRule`, `AuditLog`, `SavedView`) maintains an explicit foreign key to `Organization(id)`.

- **Server-Side Enforcement**: API endpoints extract `organizationId` directly from the authenticated JWT session cookie. Insecure Direct Object Reference (IDOR) attacks are prevented by scoping all queries with `WHERE organizationId = session.organization.id`.
- **RBAC Matrix**: Enforced via `src/lib/rbac.ts` across seven defined system roles:
  - `OWNER`: Full administrative, operational, deletion, and export powers.
  - `ADMIN`: Full configuration and team management.
  - `SALES_MANAGER`: Lead assignment, team analytics, deal supervision.
  - `SALES_REP`: Lead capture, qualification, opportunity moves, activity logging.
  - `MARKETING`: Campaign tracking, CSV imports/exports, form configurations.
  - `SUPPORT`: Customer contact lookups, ticket touchpoint notes.
  - `READ_ONLY`: Audit & analytics read privileges.

---

## 3. Core Business Engines

### 3.1 Lead Qualification & Scoring Engine (`src/lib/scoring-engine.ts`)
Calculates lead qualification scores (0–100) dynamically using active rules configured by the organization:
- **Baseline**: New leads start at +20 points.
- **Job Title Factors**: C-Level, VP, Director keywords grant score boosts (+25 points).
- **Source Weighting**: High-intent sources such as `REFERRAL` (+30) or `PHONE_CALL` (+20).
- **Deal Value Thresholds**: Opportunities with budgets > $50,000 grant enterprise weighting (+20).
- **Explainability**: Every calculation records an immutable `LeadScoringLog` detailing exact reasons.

### 3.2 Lead Assignment Engine (`src/lib/assignment-engine.ts`)
Ensures no inbound lead remains stranded:
- **Manual Assignment**: Directly assigns to designated sales representative.
- **Round-Robin**: Cycles deterministically through configured user pools, persisting `lastAssignedUserId` to prevent concurrency duplicates.
- **Least-Active Rep**: Queries open lead counts across sales reps and dynamically allocates the new lead to the representative with the lowest workload.
- **Team Dispatch**: Routes to specific regional or product sales teams.
- **Fallback Safe**: Automatically assigns to the organization fallback representative if criteria are unmet.

### 3.3 Transactional Lead Conversion (`src/app/api/leads/[id]/convert/route.ts`)
Converts qualified leads without losing data history:
1. Locates existing `Company` by domain/name or creates a new one.
2. Locates existing `Contact` by email or creates a new one marked as primary.
3. Transactionally generates an active sales opportunity `Deal` linked to the pipeline stage.
4. Updates `Lead` status to `CONVERTED`, linking `convertedContactId`, `convertedCompanyId`, and `convertedDealId`.
5. Logs a `CONVERSION` interaction on the timeline and records an immutable audit trail entry.

### 3.4 CSV Security Engine (`src/lib/csv-handler.ts`)
Guards against **Spreadsheet Formula Injection (CSV Injection)**:
- Any incoming or outgoing cell beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` is safely prefixed with a single quotation mark `'`.
- Performs duplicate detection by email and phone during bulk CSV ingestion.
