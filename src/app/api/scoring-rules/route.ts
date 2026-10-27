import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rules = await prisma.leadScoringRule.findMany({
    where: { organizationId: session.organization.id },
    orderBy: { createdAt: 'desc' },
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
    const { name, criteriaType, condition, value, scoreDelta } = body;

    const rule = await prisma.leadScoringRule.create({
      data: {
        organizationId: session.organization.id,
        name,
        criteriaType,
        condition,
        value,
        scoreDelta: parseInt(scoreDelta, 10),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create scoring rule' }, { status: 500 });
  }
}
