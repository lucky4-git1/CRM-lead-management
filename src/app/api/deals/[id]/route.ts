import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { processAutomations } from '@/lib/automation-engine';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const deal = await prisma.deal.findFirst({
    where: { id, organizationId: session.organization.id },
    include: {
      stage: true,
      pipeline: { include: { stages: { orderBy: { stageOrder: 'asc' } } } },
      company: true,
      contact: true,
      owner: { select: { id: true, firstName: true, lastName: true } },
      tasks: true,
      interactions: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

  return NextResponse.json({ deal });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'deals:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.deal.findFirst({
    where: { id, organizationId: session.organization.id },
    include: { stage: true },
  });

  if (!existing) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

  const stageChanged = body.stageId && body.stageId !== existing.stageId;
  const statusChanged = body.status && body.status !== existing.status;

  const updated = await prisma.deal.update({
    where: { id },
    data: {
      ...body,
      closedAt: body.status === 'WON' || body.status === 'LOST' ? new Date() : undefined,
    },
    include: {
      stage: true,
      company: true,
      contact: true,
    },
  });

  if (stageChanged) {
    await prisma.interaction.create({
      data: {
        organizationId: session.organization.id,
        dealId: id,
        actorId: session.user.id,
        type: 'STAGE_CHANGE',
        summary: `Deal moved to stage: ${updated.stage.name}`,
      },
    });

    await processAutomations({
      organizationId: session.organization.id,
      triggerType: 'DEAL_STAGE_CHANGED',
      entityType: 'DEAL',
      entityId: id,
      actorId: session.user.id,
      data: { ...updated },
    });
  }

  if (statusChanged) {
    const trigger = updated.status === 'WON' ? 'DEAL_WON' : updated.status === 'LOST' ? 'DEAL_LOST' : null;
    if (trigger) {
      await processAutomations({
        organizationId: session.organization.id,
        triggerType: trigger as any,
        entityType: 'DEAL',
        entityId: id,
        actorId: session.user.id,
        data: { ...updated },
      });
    }
  }

  await logAuditEvent({
    organizationId: session.organization.id,
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'DEAL',
    entityId: id,
    oldData: existing,
    newData: updated,
  });

  return NextResponse.json({ success: true, deal: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'deals:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  await prisma.deal.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
