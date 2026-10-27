import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'leads:update')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { leadIds, action, value } = await req.json();

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'leadIds array is required' }, { status: 400 });
    }

    if (action === 'assign') {
      await prisma.lead.updateMany({
        where: {
          id: { in: leadIds },
          organizationId: session.organization.id,
        },
        data: {
          ownerId: value === 'UNASSIGNED' ? null : value,
        },
      });
    } else if (action === 'update_status') {
      await prisma.lead.updateMany({
        where: {
          id: { in: leadIds },
          organizationId: session.organization.id,
        },
        data: {
          status: value,
        },
      });
    } else if (action === 'archive') {
      await prisma.lead.updateMany({
        where: {
          id: { in: leadIds },
          organizationId: session.organization.id,
        },
        data: {
          isArchived: true,
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid bulk action' }, { status: 400 });
    }

    await logAuditEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      action: 'BULK_UPDATE',
      entityType: 'LEAD',
      entityId: `bulk-${leadIds.length}`,
      newData: { action, value, count: leadIds.length },
    });

    return NextResponse.json({ success: true, count: leadIds.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bulk operation failed' }, { status: 500 });
  }
}
