import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { processAutomations } from '@/lib/automation-engine';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pipelineId = searchParams.get('pipelineId');
  const status = searchParams.get('status');

  const whereClause: any = {
    organizationId: session.organization.id,
  };

  if (pipelineId) whereClause.pipelineId = pipelineId;
  if (status && status !== 'ALL') whereClause.status = status;

  const deals = await prisma.deal.findMany({
    where: whereClause,
    include: {
      stage: true,
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      owner: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ deals });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'deals:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, amount, pipelineId, stageId, companyId, contactId, probability, expectedCloseDate, ownerId } = body;

    if (!title || !pipelineId || !stageId) {
      return NextResponse.json({ error: 'Title, pipeline, and stage are required' }, { status: 400 });
    }

    const deal = await prisma.deal.create({
      data: {
        organizationId: session.organization.id,
        title,
        amount: parseFloat(amount) || 0,
        pipelineId,
        stageId,
        companyId: companyId || null,
        contactId: contactId || null,
        probability: probability !== undefined ? parseInt(probability, 10) : 20,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        ownerId: ownerId || session.user.id,
        status: 'OPEN',
      },
      include: {
        stage: true,
        company: true,
        contact: true,
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.interaction.create({
      data: {
        organizationId: session.organization.id,
        dealId: deal.id,
        contactId: contactId || null,
        companyId: companyId || null,
        actorId: session.user.id,
        type: 'STAGE_CHANGE',
        summary: `Deal created in stage: ${deal.stage.name}`,
      },
    });

    await logAuditEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'DEAL',
      entityId: deal.id,
      newData: { title: deal.title, amount: deal.amount, stage: deal.stage.name },
    });

    return NextResponse.json({ success: true, deal }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create deal' }, { status: 500 });
  }
}
