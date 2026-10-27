import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { InteractionType, InteractionDirection } from '@prisma/client';

export async function POST(
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
  const {
    type = 'NOTE',
    direction = 'INTERNAL',
    summary,
    body: interactionBody,
    outcome,
    durationSeconds,
  } = body;

  if (!summary) {
    return NextResponse.json({ error: 'Summary is required' }, { status: 400 });
  }

  const lead = await prisma.lead.findFirst({
    where: { id, organizationId: session.organization.id },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const interaction = await prisma.interaction.create({
    data: {
      organizationId: session.organization.id,
      leadId: id,
      actorId: session.user.id,
      type: type as InteractionType,
      direction: direction as InteractionDirection,
      summary,
      body: interactionBody || null,
      outcome: outcome || null,
      durationSeconds: durationSeconds ? parseInt(durationSeconds, 10) : null,
    },
    include: {
      actor: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Update lead last contact timestamp
  await prisma.lead.update({
    where: { id },
    data: { lastContactAt: new Date() },
  });

  return NextResponse.json({ success: true, interaction }, { status: 201 });
}
