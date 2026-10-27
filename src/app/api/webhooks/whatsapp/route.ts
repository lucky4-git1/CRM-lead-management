import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { IntegrationAdapters } from '@/lib/integration-adapters';
import { determineLeadAssignment } from '@/lib/assignment-engine';
import { processAutomations } from '@/lib/automation-engine';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'crm_webhook_verify_token_secure';

  if (mode === 'subscribe' && token === expectedToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = IntegrationAdapters.parseWhatsAppWebhook(payload);

    if (!parsed) {
      return NextResponse.json({ received: true, ignored: true });
    }

    // Find default organization with active WhatsApp integration
    const integration = await prisma.integrationAccount.findFirst({
      where: { provider: 'WHATSAPP', isActive: true },
    });

    if (!integration) {
      return NextResponse.json({ received: true, error: 'No active WhatsApp integration account' });
    }

    const orgId = integration.organizationId;
    const phone = `+${parsed.fromNumber.replace(/\D/g, '')}`;

    // Find or create lead
    let lead = await prisma.lead.findFirst({
      where: { organizationId: orgId, phone },
    });

    if (!lead) {
      const normalized = IntegrationAdapters.whatsAppToLead(parsed);
      const assignment = await determineLeadAssignment(orgId, {
        source: 'WHATSAPP',
        qualificationScore: 40,
      });

      lead = await prisma.lead.create({
        data: {
          organizationId: orgId,
          firstName: normalized.firstName,
          lastName: normalized.lastName,
          phone,
          whatsapp: phone,
          source: 'WHATSAPP',
          sourceChannel: 'whatsapp_cloud_api',
          ownerId: assignment.assignedOwnerId,
          qualificationScore: 40,
          status: 'NEW',
          notes: parsed.messageText,
          consentGiven: true,
          consentTimestamp: new Date(),
        },
      });

      await processAutomations({
        organizationId: orgId,
        triggerType: 'LEAD_CREATED',
        entityType: 'LEAD',
        entityId: lead.id,
        data: { ...lead },
      });
    }

    // Record interaction timeline
    await prisma.interaction.create({
      data: {
        organizationId: orgId,
        leadId: lead.id,
        type: 'WHATSAPP',
        direction: 'INBOUND',
        summary: `Inbound WhatsApp: ${parsed.messageText.slice(0, 80)}`,
        body: parsed.messageText,
        metadata: { messageId: parsed.messageId, from: parsed.fromNumber },
      },
    });

    // Create follow-up task if pending
    await prisma.task.create({
      data: {
        organizationId: orgId,
        title: `Reply to WhatsApp message from ${lead.firstName}`,
        description: parsed.messageText,
        taskType: 'WHATSAPP',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 2 * 3600000), // 2 hours
        assignedToId: lead.ownerId,
        leadId: lead.id,
      },
    });

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}
