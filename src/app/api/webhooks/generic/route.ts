import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { IntegrationAdapters } from '@/lib/integration-adapters';
import { calculateLeadScore } from '@/lib/scoring-engine';
import { determineLeadAssignment } from '@/lib/assignment-engine';
import { processAutomations } from '@/lib/automation-engine';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const normalized = IntegrationAdapters.parseGenericWebhook(payload);

    // Find default organization
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 400 });

    const score = await calculateLeadScore(org.id, {
      jobTitle: normalized.jobTitle,
      companyName: normalized.companyName,
      source: normalized.source,
      estimatedValue: normalized.estimatedValue,
    });

    const assignment = await determineLeadAssignment(org.id, {
      source: normalized.source,
      qualificationScore: score.score,
      estimatedValue: normalized.estimatedValue,
    });

    const lead = await prisma.lead.create({
      data: {
        organizationId: org.id,
        firstName: normalized.firstName,
        lastName: normalized.lastName,
        email: normalized.email || null,
        phone: normalized.phone || null,
        companyName: normalized.companyName || null,
        source: normalized.source,
        sourceCampaign: normalized.sourceCampaign || null,
        sourceChannel: normalized.sourceChannel || 'generic_webhook',
        ownerId: assignment.assignedOwnerId,
        teamId: assignment.assignedTeamId,
        qualificationScore: score.score,
        estimatedValue: normalized.estimatedValue || 0,
        notes: normalized.notes || null,
      },
    });

    await prisma.interaction.create({
      data: {
        organizationId: org.id,
        leadId: lead.id,
        type: 'NOTE',
        summary: 'Ingested via Generic Webhook',
        body: normalized.notes || 'External webhook lead payload captured',
      },
    });

    await processAutomations({
      organizationId: org.id,
      triggerType: 'LEAD_CREATED',
      entityType: 'LEAD',
      entityId: lead.id,
      data: { ...lead },
    });

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Generic webhook failed' }, { status: 500 });
  }
}
