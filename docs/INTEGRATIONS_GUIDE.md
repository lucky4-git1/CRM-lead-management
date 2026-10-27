# LeadFlow CRM — Multichannel Integrations Guide

LeadFlow CRM includes built-in adapters and webhook listeners for major customer communication channels.

---

## 1. Official WhatsApp Business Cloud API

### Capabilities
- Inbound customer chat messages automatically create new leads or link to existing lead records by phone number.
- Interaction history logs incoming messages on the lead timeline.
- Follow-up response tasks are automatically created and assigned to the lead owner.

### Configuration Steps
1. Navigate to **Meta for Developers** (`developers.facebook.com`) and open your **WhatsApp Business App**.
2. Under **Configuration > Webhook**:
   - **Callback URL**: `https://your-crm-domain.com/api/webhooks/whatsapp`
   - **Verify Token**: Enter the value configured in `.env` under `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (default: `crm_webhook_verify_token_secure`).
3. Subscribe to the `messages` webhook field.
4. Set `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in `.env` to enable authorized outbound responses.

---

## 2. Twilio SMS & Voice Integration

### Capabilities
- Incoming SMS messages are parsed and associated with matching leads.
- Inbound voice call events capture caller ID, call status, duration in seconds, and recording URLs.

### Configuration Steps
1. Log in to your **Twilio Console** (`console.twilio.com`).
2. Go to **Phone Numbers > Active Numbers** and select your CRM phone number.
3. Under **Messaging**:
   - Set **A Message Comes In** Webhook URL to: `https://your-crm-domain.com/api/webhooks/twilio` (HTTP POST).
4. Under **Voice & Fax**:
   - Set **Call Status Changes** Webhook URL to: `https://your-crm-domain.com/api/webhooks/twilio` (HTTP POST).

---

## 3. Public Website Lead Capture Forms

### Capabilities
- Standalone or embeddable HTML forms.
- Antispam protection using honeypot fields (`_hp`).
- Automatic UTM tracking (`utm_source`, `utm_campaign`, `utm_medium`).
- CORS support allowing submission from external marketing websites.

### Embed Example:
```html
<form action="https://your-crm-domain.com/api/public/capture/acme-inbound-demo-form-2026" method="POST">
  <!-- Hidden Honeypot Field -->
  <input type="text" name="_hp" style="display:none;" tabindex="-1" autocomplete="off" />

  <input type="text" name="firstName" placeholder="First Name" required />
  <input type="text" name="lastName" placeholder="Last Name" required />
  <input type="email" name="email" placeholder="Work Email" required />
  <input type="tel" name="phone" placeholder="Phone" />
  <input type="text" name="companyName" placeholder="Company" />
  <textarea name="notes" placeholder="How can we help?"></textarea>

  <button type="submit">Request Enterprise Demo</button>
</form>
```

---

## 4. Generic Webhook Receiver

### Endpoint: `POST /api/webhooks/generic`
Connects third-party tools such as **Zapier**, **Make.com**, **Facebook Lead Ads**, or custom web scrapers.
- **Accepted Payload Format:**
  ```json
  {
    "firstName": "Jordan",
    "lastName": "Bell",
    "email": "jordan@example.com",
    "phone": "+1-555-0144",
    "company": "Horizon Capital",
    "budget": 50000,
    "utm_source": "linkedin_lead_gen",
    "utm_campaign": "q4_executive_outreach",
    "message": "Interested in 50-seat team deployment"
  }
  ```
