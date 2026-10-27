import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { AIService } from '@/lib/ai-service';

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
      interactions: true,
    },
  });

  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

  const prediction = AIService.evaluateDealHealth({
    amount: deal.amount,
    probability: deal.probability,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
    status: deal.status,
    interactionsCount: deal.interactions.length,
  });

  return NextResponse.json({ success: true, prediction });
}
