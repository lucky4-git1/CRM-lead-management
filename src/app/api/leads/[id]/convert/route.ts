import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'leads:update')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { createDeal = true, dealTitle, dealAmount } = body;

  const lead = await prisma.lead.findFirst({
    where: { id, organizationId: session.organization.id },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  if (lead.status === 'CONVERTED') {
    return NextResponse.json({ error: 'Lead is already converted' }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create Company
      let company = null;
      if (lead.companyName) {
        company = await tx.company.findFirst({
          where: {
            organizationId: session.organization.id,
            name: { equals: lead.companyName, mode: 'insensitive' },
          },
        });

        if (!company) {
          company = await tx.company.create({
            data: {
              organizationId: session.organization.id,
              name: lead.companyName,
              website: lead.website || null,
              industry: lead.industry || null,
              city: lead.city || null,
              state: lead.state || null,
              country: lead.country || null,
              ownerId: lead.ownerId || session.user.id,
            },
          });
        }
      }

      // 2. Find or create Contact
      let contact = null;
      if (lead.email) {
        contact = await tx.contact.findFirst({
          where: {
            organizationId: session.organization.id,
            email: lead.email,
          },
        });
      }

      if (!contact) {
        contact = await tx.contact.create({
          data: {
            organizationId: session.organization.id,
            companyId: company?.id || null,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email || null,
            phone: lead.phone || lead.whatsapp || null,
            jobTitle: lead.jobTitle || null,
            isPrimary: true,
            lifecycleStage: 'OPPORTUNITY',
            ownerId: lead.ownerId || session.user.id,
            convertedFromLeadId: lead.id,
          },
        });
      }

      // 3. Optionally create Deal
      let deal = null;
      if (createDeal) {
        const pipeline = await tx.pipeline.findFirst({
          where: { organizationId: session.organization.id, isDefault: true },
          include: { stages: { orderBy: { stageOrder: 'asc' } } },
        });

        const initialStage = pipeline?.stages[0];

        deal = await tx.deal.create({
          data: {
            organizationId: session.organization.id,
            pipelineId: pipeline?.id || '',
            stageId: initialStage?.id || '',
            title: dealTitle || `${lead.companyName || lead.firstName} - Opportunity`,
            amount: Number(dealAmount || lead.estimatedValue || 0),
            ownerId: lead.ownerId || session.user.id,
            contactId: contact.id,
            companyId: company?.id || null,
            leadId: lead.id,
            status: 'OPEN',
          },
        });
      }

      // 4. Update Lead to CONVERTED, preserving attribution
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: 'CONVERTED',
          convertedAt: new Date(),
          convertedContactId: contact.id,
          convertedCompanyId: company?.id || null,
          convertedDealId: deal?.id || null,
        },
      });

      // 5. Record Conversion Event on Interaction Timeline
      await tx.interaction.create({
        data: {
          organizationId: session.organization.id,
          leadId: lead.id,
          contactId: contact.id,
          companyId: company?.id || null,
          dealId: deal?.id || null,
          actorId: session.user.id,
          type: 'CONVERSION',
          summary: `Lead converted to Contact ${contact.firstName} ${contact.lastName}`,
          body: `Converted to Contact (${contact.id})${company ? `, Company (${company.name})` : ''}${deal ? `, Deal (${deal.title})` : ''}`,
        },
      });

      return { lead: updatedLead, contact, company, deal };
    });

    await logAuditEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      action: 'CONVERT',
      entityType: 'LEAD',
      entityId: lead.id,
      newData: {
        convertedContactId: result.contact.id,
        convertedCompanyId: result.company?.id,
        convertedDealId: result.deal?.id,
      },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Conversion failed' }, { status: 500 });
  }
}
