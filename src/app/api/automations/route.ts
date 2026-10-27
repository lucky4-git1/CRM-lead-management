import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rules = await prisma.automationRule.findMany({
    where: { organizationId: session.organization.id },
    include: {
      logs: {
        orderBy: { executedAt: 'desc' },
        take: 10,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ rules });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'automations:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, description, triggerType, conditions = [], actions = [] } = body;

    if (!name || !triggerType) {
      return NextResponse.json({ error: 'Name and triggerType are required' }, { status: 400 });
    }

    const rule = await prisma.automationRule.create({
      data: {
        organizationId: session.organization.id,
        name,
        description: description || null,
        triggerType,
        conditions,
        actions,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create automation rule' }, { status: 500 });
  }
}
