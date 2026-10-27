# LeadFlow CRM — REST API Documentation

All API routes require authentication via the HTTP-only `crm_token` cookie, except for public lead capture and external webhook receivers.

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticates a user and sets a secure `crm_token` session cookie.
- **Request Body:**
  ```json
  {
    "email": "admin@acme.com",
    "password": "password123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid",
      "email": "admin@acme.com",
      "firstName": "Sarah",
      "lastName": "Connor",
      "role": "OWNER"
    },
    "organization": {
      "id": "uuid",
      "name": "Acme Enterprise Solutions",
      "slug": "acme"
    }
  }
  ```

### `POST /api/auth/register`
Creates a new organization, default pipeline, stages, and administrative owner account.

### `GET /api/auth/me`
Returns the active session's user and organization data.

### `POST /api/auth/logout`
Clears the session cookie.

---

## 2. Leads Endpoints

### `GET /api/leads`
Retrieves a paginated list of leads with server-side filtering, sorting, and search.
- **Query Parameters:**
  - `page`: Page number (default: 1)
  - `limit`: Number of leads per page (default: 25)
  - `search`: Case-insensitive text search (name, email, phone, company)
  - `status`: `ALL`, `NEW`, `CONTACTED`, `QUALIFIED`, `NURTURING`, `CONVERTED`, `LOST`
  - `source`: `ALL`, `WEBSITE`, `WHATSAPP`, `SMS`, `PHONE_CALL`, `SOCIAL`, `REFERRAL`
  - `priority`: `ALL`, `LOW`, `MEDIUM`, `HIGH`, `URGENT`
  - `sortBy`: Field name (`createdAt`, `estimatedValue`, `qualificationScore`)
  - `sortOrder`: `asc` or `desc`

### `POST /api/leads`
Creates a new lead, executes the lead scoring formula, performs deterministic assignment, triggers automations, and records timeline and audit logs.

### `GET /api/leads/:id`
Returns full profile details for a specific lead, including assigned owner, team, scheduled tasks, scoring logs, and complete interaction timeline.

### `PATCH /api/leads/:id`
Updates lead fields. Automatically logs `STATUS_CHANGE` or `ASSIGNMENT` timeline entries and triggers automation hooks.

### `DELETE /api/leads/:id`
Soft-deletes (archives) the lead. Requires `leads:delete` permission.

### `POST /api/leads/:id/convert`
Transactionally converts the lead into a Contact, Company, and Deal while preserving all history and source attribution.

### `POST /api/leads/:id/interactions`
Logs a call, email, WhatsApp message, meeting, or internal note directly onto the lead's unified timeline.

### `POST /api/leads/import`
Accepts CSV content, validates rows, sanitizes formula injection patterns, detects duplicate email/phone records, and bulk-inserts leads.

### `GET /api/leads/export`
Exports filtered leads as a sanitized CSV file with `Content-Disposition: attachment`.

### `POST /api/leads/bulk`
Performs bulk operations on multiple leads (`update_status`, `assign`, `archive`).

---

## 3. Opportunities & Pipelines

### `GET /api/deals`
Retrieves deals filtered by pipeline ID and status.

### `POST /api/deals`
Creates a new sales opportunity linked to a contact and company.

### `PATCH /api/deals/:id`
Updates deal stage (advance via Kanban drag/click), probability, and status (`OPEN`, `WON`, `LOST`). Fires `DEAL_STAGE_CHANGED`, `DEAL_WON`, or `DEAL_LOST` automation events.

### `GET /api/pipelines`
Retrieves organization pipelines and configured stages.

---

## 4. Tasks & Productive Reminders

### `GET /api/tasks`
Filters tasks by status (`PENDING`, `COMPLETED`), overdue condition (`filter=overdue`), or assignee (`filter=my`).

### `POST /api/tasks`
Creates a follow-up task with due date, priority, and association to a lead, deal, or contact.

### `PATCH /api/tasks/:id`
Updates task status and completion outcome.

---

## 5. Analytics & Performance

### `GET /api/analytics`
Returns database-backed metrics: Total Leads, New Leads Today/Week, Qualified Leads, Open Pipeline Value, Weighted Pipeline Forecast, Won Revenue, Win Rate %, Overdue Tasks Count, and Channel Acquisition Breakdown.

### `GET /api/team-performance`
Computes individual sales representative rankings, assigned lead counts, conversion rates, and closed won opportunity totals.

---

## 6. Public Ingestion & Webhooks

### `POST /api/public/capture/:formKey`
Public CORS-enabled endpoint for embeddable forms. Includes spam honeypot validation (`_hp`), automatic score calculation, and lead routing.

### `GET /api/webhooks/whatsapp`
Handles Meta Graph API webhook subscription verification (`hub.challenge`).

### `POST /api/webhooks/whatsapp`
Ingests inbound WhatsApp messages, associates them with existing leads by phone or creates a new lead, logs timeline interactions, and schedules response tasks.

### `POST /api/webhooks/twilio`
Ingests Twilio SMS and Voice Call completed webhooks, logging duration, status, and recording references.

### `POST /api/webhooks/generic`
Normalizes incoming JSON payloads from Zapier, Make, or custom web services into CRM leads.
