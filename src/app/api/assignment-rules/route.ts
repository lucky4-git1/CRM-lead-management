import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rules = await prisma.leadAssignmentRule.findMany({
    where: { organizationId: session.organization.id },
    orderBy: { priority: 'asc' },
  });

  return NextResponse.json({ rules });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'settings:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, strategy, priority = 1, conditions = {}, roundRobinUserIds = [], assignToTeamId, fallbackUserId } = body;

    const rule = await prisma.leadAssignmentRule.create({
      data: {
        organizationId: session.organization.id,
        name,
        strategy,
        priority: parseInt(priority, 10),
        conditions,
        roundRobinUserIds,
        assignToTeamId: assignToTeamId || null,
        fallbackUserId: fallbackUserId || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create assignment rule' }, { status: 500 });
  }
}
