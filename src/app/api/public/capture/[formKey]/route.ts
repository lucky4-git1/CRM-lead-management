import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateLeadScore } from '@/lib/scoring-engine';
import { determineLeadAssignment } from '@/lib/assignment-engine';
import { processAutomations } from '@/lib/automation-engine';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ formKey: string }> }
) {
  const { formKey } = await params;

  const form = await prisma.leadCaptureForm.findUnique({
    where: { publicFormKey: formKey },
  });

  if (!form || !form.isActive) {
    return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 });
  }

  try {
    const body = await req.json();

    // Honeypot spam protection: if hidden field '_hp' is filled, silently discard spam
    if (body._hp) {
      return NextResponse.json({ success: true, message: form.successMessage });
    }

    const {
      firstName,
      lastName = 'Lead',
      email,
      phone,
      companyName,
      jobTitle,
      notes,
      utm_source,
      utm_campaign,
      utm_medium,
    } = body;

    if (!firstName) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }

    // Check duplicate by email
    let lead = null;
    if (email) {
      lead = await prisma.lead.findFirst({
        where: {
          organizationId: form.organizationId,
          email: email.trim().toLowerCase(),
        },
      });
    }

    if (lead) {
      // Record update interaction for existing lead
      await prisma.interaction.create({
        data: {
          organizationId: form.organizationId,
          leadId: lead.id,
          type: 'NOTE',
          summary: `Re-submitted website form: ${form.name}`,
          body: notes || `UTM: ${utm_source || ''} / ${utm_campaign || ''}`,
        },
      });
    } else {
      // Calculate score & assign
      const score = await calculateLeadScore(form.organizationId, {
        jobTitle,
        companyName,
        source: form.defaultLeadSource,
        estimatedValue: 10000,
      });

      const assignment = await determineLeadAssignment(form.organizationId, {
        source: form.defaultLeadSource,
        qualificationScore: score.score,
        ownerId: form.defaultOwnerId,
      });

      lead = await prisma.lead.create({
        data: {
          organizationId: form.organizationId,
          firstName,
          lastName,
          email: email ? email.trim().toLowerCase() : null,
          phone: phone || null,
          companyName: companyName || null,
          jobTitle: jobTitle || null,
          source: form.defaultLeadSource,
          sourceCampaign: utm_campaign || form.defaultCampaign || null,
          sourceChannel: utm_source || utm_medium || 'web_form',
          ownerId: assignment.assignedOwnerId,
          teamId: assignment.assignedTeamId,
          qualificationScore: score.score,
          notes: notes || null,
          consentGiven: true,
          consentTimestamp: new Date(),
        },
      });

      // Log interaction
      await prisma.interaction.create({
        data: {
          organizationId: form.organizationId,
          leadId: lead.id,
          type: 'NOTE',
          summary: `Captured via form: ${form.name}`,
          body: notes || `Assigned to ${assignment.assignedOwnerId || 'Team'} via ${assignment.strategyUsed}`,
        },
      });

      // Run automations
      await processAutomations({
        organizationId: form.organizationId,
        triggerType: 'LEAD_CREATED',
        entityType: 'LEAD',
        entityId: lead.id,
        data: { ...lead },
      });
    }

    // Increment submissions count
    await prisma.leadCaptureForm.update({
      where: { id: form.id },
      data: { submissionsCount: { increment: 1 } },
    });

    return NextResponse.json(
      { success: true, message: form.successMessage },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Submission failed' }, { status: 500 });
  }
}
