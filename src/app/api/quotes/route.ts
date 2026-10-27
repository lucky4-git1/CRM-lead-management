import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dealId = searchParams.get('dealId');

  const whereClause: any = { organizationId: session.organization.id };
  if (dealId) whereClause.dealId = dealId;

  const quotes = await prisma.quote.findMany({
    where: whereClause,
    include: {
      deal: {
        select: { id: true, title: true, company: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ quotes });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { dealId, title, lineItems = [], discount = 0, tax = 0, notes, expiresDays = 14 } = body;

    if (!dealId || !title) {
      return NextResponse.json({ error: 'dealId and title are required' }, { status: 400 });
    }

    const subtotal = lineItems.reduce((sum: number, item: any) => sum + (item.unitPrice * item.qty || 0), 0);
    const total = Math.max(0, subtotal - (parseFloat(discount) || 0) + (parseFloat(tax) || 0));

    const quoteNumber = `QUO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const quote = await prisma.quote.create({
      data: {
        organizationId: session.organization.id,
        dealId,
        quoteNumber,
        title,
        status: 'SENT',
        subtotal,
        discount: parseFloat(discount) || 0,
        tax: parseFloat(tax) || 0,
        total,
        expiresAt: new Date(Date.now() + expiresDays * 86400000),
        lineItems,
        notes,
      },
    });

    // Record quote sent on deal interaction timeline
    await prisma.interaction.create({
      data: {
        organizationId: session.organization.id,
        dealId,
        actorId: session.user.id,
        type: 'NOTE',
        summary: `Generated Quote: ${quote.quoteNumber} ($${total.toLocaleString()})`,
        body: `Title: ${title}\nSubtotal: $${subtotal.toLocaleString()}\nTotal: $${total.toLocaleString()}`,
      },
    });

    return NextResponse.json({ success: true, quote }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create quote' }, { status: 500 });
  }
}
