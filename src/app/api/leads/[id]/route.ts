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

  const lead = await prisma.lead.findFirst({
    where: {
      id,
      organizationId: session.organization.id,
    },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      team: { select: { id: true, name: true } },
      tasks: {
        orderBy: { dueDate: 'asc' },
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      interactions: {
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      scoringLogs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json({ lead });
}

export async function PATCH(
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

  const existing = await prisma.lead.findFirst({
    where: { id, organizationId: session.organization.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const statusChanged = body.status && body.status !== existing.status;
  const ownerChanged = body.ownerId !== undefined && body.ownerId !== existing.ownerId;

  const updated = await prisma.lead.update({
    where: { id },
    data: {
      ...body,
      updatedById: session.user.id,
      updatedAt: new Date(),
    },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // If status changed, record timeline interaction and trigger automations
  if (statusChanged) {
    await prisma.interaction.create({
      data: {
        organizationId: session.organization.id,
        leadId: id,
        actorId: session.user.id,
        type: 'STATUS_CHANGE',
        summary: `Status changed from ${existing.status} to ${body.status}`,
      },
    });

    await processAutomations({
      organizationId: session.organization.id,
      triggerType: 'LEAD_STATUS_CHANGED',
      entityType: 'LEAD',
      entityId: id,
      actorId: session.user.id,
      data: {
        ...updated,
        oldStatus: existing.status,
        newStatus: body.status,
      },
    });
  }

  // If owner changed, record assignment timeline interaction
  if (ownerChanged) {
    await prisma.interaction.create({
      data: {
        organizationId: session.organization.id,
        leadId: id,
        actorId: session.user.id,
        type: 'ASSIGNMENT',
        summary: `Reassigned lead`,
        body: `Lead reassigned to user ID ${body.ownerId || 'Unassigned'}`,
      },
    });

    await processAutomations({
      organizationId: session.organization.id,
      triggerType: 'LEAD_ASSIGNED',
      entityType: 'LEAD',
      entityId: id,
      actorId: session.user.id,
      data: {
        ...updated,
      },
    });
  }

  await logAuditEvent({
    organizationId: session.organization.id,
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'LEAD',
    entityId: id,
    oldData: existing,
    newData: updated,
  });

  return NextResponse.json({ success: true, lead: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'leads:delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id, organizationId: session.organization.id },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Soft delete / archive
  await prisma.lead.update({
    where: { id },
    data: { isArchived: true },
  });

  await logAuditEvent({
    organizationId: session.organization.id,
    userId: session.user.id,
    action: 'DELETE',
    entityType: 'LEAD',
    entityId: id,
    oldData: { name: `${lead.firstName} ${lead.lastName}`, email: lead.email },
  });

  return NextResponse.json({ success: true, message: 'Lead archived successfully' });
}
