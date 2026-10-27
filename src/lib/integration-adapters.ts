import { LeadSource } from '@prisma/client';

export interface NormalizedLeadPayload {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  source: LeadSource;
  sourceCampaign?: string;
  sourceChannel?: string;
  externalSourceId?: string;
  notes?: string;
  estimatedValue?: number;
}

export class IntegrationAdapters {
  /**
   * Parses WhatsApp Business Cloud API incoming webhook
   */
  static parseWhatsAppWebhook(payload: any): {
    fromNumber: string;
    messageText: string;
    messageId: string;
    senderName?: string;
  } | null {
    try {
      const entry = payload?.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];
      const contact = change?.contacts?.[0];

      if (!message) return null;

      const fromNumber = message.from;
      const messageText = message.text?.body || message.button?.text || '[Media message]';
      const messageId = message.id;
      const senderName = contact?.profile?.name || 'WhatsApp Contact';

      return {
        fromNumber,
        messageText,
        messageId,
        senderName,
      };
    } catch {
      return null;
    }
  }

  /**
   * Normalizes incoming WhatsApp message into a Lead payload
   */
  static whatsAppToLead(data: {
    fromNumber: string;
    senderName?: string;
    messageText: string;
  }): NormalizedLeadPayload {
    const parts = (data.senderName || 'WhatsApp User').split(' ');
    const firstName = parts[0] || 'WhatsApp';
    const lastName = parts.slice(1).join(' ') || 'User';

    return {
      firstName,
      lastName,
      phone: `+${data.fromNumber.replace(/\D/g, '')}`,
      source: 'WHATSAPP',
      sourceChannel: 'whatsapp_cloud_api',
      notes: `Inbound WhatsApp: ${data.messageText}`,
    };
  }

  /**
   * Parses incoming Twilio SMS webhook
   */
  static parseTwilioSmsWebhook(body: Record<string, any>): NormalizedLeadPayload | null {
    const from = body.From || body.from;
    const bodyText = body.Body || body.body || '';
    if (!from) return null;

    return {
      firstName: 'SMS',
      lastName: from.slice(-4),
      phone: from,
      source: 'SMS',
      sourceChannel: 'twilio_sms',
      notes: `Inbound SMS: ${bodyText}`,
    };
  }

  /**
   * Parses Telephony Call webhook
   */
  static parseCallEventWebhook(body: Record<string, any>): {
    callerNumber: string;
    callSid: string;
    durationSeconds?: number;
    callStatus: string;
    recordingUrl?: string;
  } {
    return {
      callerNumber: body.From || body.caller || body.phoneNumber || 'Unknown',
      callSid: body.CallSid || body.callId || `call-${Date.now()}`,
      durationSeconds: parseInt(body.CallDuration || body.duration || '0', 10),
      callStatus: body.CallStatus || body.status || 'completed',
      recordingUrl: body.RecordingUrl || body.recordingUrl,
    };
  }

  /**
   * Parses generic JSON webhook payload
   */
  static parseGenericWebhook(payload: any): NormalizedLeadPayload {
    const firstName = payload.firstName || payload.first_name || payload.name?.split(' ')[0] || 'Website';
    const lastName = payload.lastName || payload.last_name || payload.name?.split(' ').slice(1).join(' ') || 'Lead';

    return {
      firstName,
      lastName,
      email: payload.email || payload.work_email,
      phone: payload.phone || payload.mobile || payload.tel,
      companyName: payload.company || payload.companyName || payload.organization,
      source: 'WEBSITE',
      sourceCampaign: payload.utm_campaign || payload.campaign,
      sourceChannel: payload.utm_source || 'api_webhook',
      externalSourceId: payload.id ? String(payload.id) : undefined,
      notes: payload.message || payload.comments || payload.notes,
      estimatedValue: payload.budget ? parseFloat(payload.budget) : undefined,
    };
  }
}
