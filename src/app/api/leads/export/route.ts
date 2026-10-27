import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { generateLeadsCsv } from '@/lib/csv-handler';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'leads:export')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const whereClause: any = {
    organizationId: session.organization.id,
    isArchived: false,
  };

  if (status && status !== 'ALL') {
    whereClause.status = status;
  }

  const leads = await prisma.lead.findMany({
    where: whereClause,
    include: {
      owner: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const csv = generateLeadsCsv(leads);

  await logAuditEvent({
    organizationId: session.organization.id,
    userId: session.user.id,
    action: 'EXPORT',
    entityType: 'LEAD',
    entityId: `export-${Date.now()}`,
    newData: { exportedCount: leads.length },
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
