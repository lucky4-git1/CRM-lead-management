import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { IntegrationAdapters } from '@/lib/integration-adapters';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let body: any = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        body[key] = value.toString();
      });
    } else {
      body = await req.json();
    }

    const integration = await prisma.integrationAccount.findFirst({
      where: { provider: 'TWILIO_SMS', isActive: true },
    });

    if (!integration) {
      return NextResponse.json({ received: true, error: 'No active Twilio integration' });
    }

    const orgId = integration.organizationId;

    // Check if SMS or Voice Call event
    if (body.CallSid) {
      const callData = IntegrationAdapters.parseCallEventWebhook(body);
      const lead = await prisma.lead.findFirst({
        where: { organizationId: orgId, phone: callData.callerNumber },
      });

      await prisma.interaction.create({
        data: {
          organizationId: orgId,
          leadId: lead?.id || null,
          type: 'CALL',
          direction: 'INBOUND',
          summary: `Inbound Call: ${callData.callStatus} (${callData.durationSeconds}s)`,
          outcome: callData.callStatus,
          durationSeconds: callData.durationSeconds,
          metadata: {
            callSid: callData.callSid,
            recordingUrl: callData.recordingUrl,
          },
        },
      });

      return NextResponse.json({ success: true, type: 'CALL' });
    } else if (body.Body) {
      const smsLead = IntegrationAdapters.parseTwilioSmsWebhook(body);
      if (smsLead && smsLead.phone) {
        let lead = await prisma.lead.findFirst({
          where: { organizationId: orgId, phone: smsLead.phone },
        });

        if (!lead) {
          lead = await prisma.lead.create({
            data: {
              organizationId: orgId,
              firstName: smsLead.firstName,
              lastName: smsLead.lastName,
              phone: smsLead.phone,
              source: 'SMS',
              notes: smsLead.notes,
              qualificationScore: 35,
            },
          });
        }

        await prisma.interaction.create({
          data: {
            organizationId: orgId,
            leadId: lead.id,
            type: 'SMS',
            direction: 'INBOUND',
            summary: `Inbound SMS: ${body.Body.slice(0, 60)}`,
            body: body.Body,
            metadata: { messageSid: body.MessageSid },
          },
        });

        return NextResponse.json({ success: true, type: 'SMS' });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Webhook failed' }, { status: 500 });
  }
}
