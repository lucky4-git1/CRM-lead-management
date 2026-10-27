import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { signatureName } = await req.json();

  if (!signatureName) {
    return NextResponse.json({ error: 'Signature name is required' }, { status: 400 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { deal: true },
  });

  if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

  const updatedQuote = await prisma.quote.update({
    where: { id },
    data: {
      status: 'ACCEPTED',
      signatureName,
      signedAt: new Date(),
    },
  });

  // Automatically advance Deal to Closed Won
  const wonStage = await prisma.pipelineStage.findFirst({
    where: { pipelineId: quote.deal.pipelineId, isWon: true },
  });

  if (wonStage) {
    await prisma.deal.update({
      where: { id: quote.dealId },
      data: {
        stageId: wonStage.id,
        status: 'WON',
        probability: 100,
        closedAt: new Date(),
      },
    });

    await prisma.interaction.create({
      data: {
        organizationId: quote.organizationId,
        dealId: quote.dealId,
        type: 'CONVERSION',
        summary: `Quote ${quote.quoteNumber} digitally signed by ${signatureName}! Deal Closed Won.`,
        outcome: 'Contract signed digitally.',
      },
    });
  }

  return NextResponse.json({ success: true, quote: updatedQuote });
}
