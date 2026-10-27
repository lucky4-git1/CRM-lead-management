import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pipelines = await prisma.pipeline.findMany({
    where: { organizationId: session.organization.id },
    include: {
      stages: {
        orderBy: { stageOrder: 'asc' },
      },
    },
  });

  return NextResponse.json({ pipelines });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'settings:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { name, stages } = await req.json();

    const pipeline = await prisma.pipeline.create({
      data: {
        organizationId: session.organization.id,
        name: name || 'New Pipeline',
        stages: {
          create: (stages || []).map((s: any, idx: number) => ({
            name: s.name,
            stageOrder: idx + 1,
            winProbability: s.winProbability || 10,
            color: s.color || '#3b82f6',
            isWon: !!s.isWon,
            isLost: !!s.isLost,
          })),
        },
      },
      include: { stages: true },
    });

    return NextResponse.json({ success: true, pipeline }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create pipeline' }, { status: 500 });
  }
}
