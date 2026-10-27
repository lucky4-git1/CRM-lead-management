import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { calculateLeadScore } from '@/lib/scoring-engine';
import { determineLeadAssignment } from '@/lib/assignment-engine';
import { processAutomations } from '@/lib/automation-engine';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'leads:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const source = searchParams.get('source');
  const ownerId = searchParams.get('ownerId');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  const whereClause: any = {
    organizationId: session.organization.id,
    isArchived: false,
  };

  if (status && status !== 'ALL') {
    whereClause.status = status;
  }
  if (priority && priority !== 'ALL') {
    whereClause.priority = priority;
  }
  if (source && source !== 'ALL') {
    whereClause.source = source;
  }
  if (ownerId && ownerId !== 'ALL') {
    whereClause.ownerId = ownerId === 'UNASSIGNED' ? null : ownerId;
  }

  if (search) {
    whereClause.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, leads] = await Promise.all([
    prisma.lead.count({ where: whereClause }),
    prisma.lead.findMany({
      where: whereClause,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    leads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'leads:create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      whatsapp,
      companyName,
      jobTitle,
      website,
      industry,
      city,
      state,
      country,
      source = 'WEBSITE',
      sourceCampaign,
      sourceChannel,
      priority = 'MEDIUM',
      interestedProduct,
      estimatedValue = 0,
      notes,
      tags = [],
      ownerId,
    } = body;

    if (!firstName) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }

    // 1. Calculate qualification score
    const scoreResult = await calculateLeadScore(session.organization.id, {
      jobTitle,
      companyName,
      source,
      estimatedValue: Number(estimatedValue),
      country,
    });

    // 2. Determine lead assignment
    const assignment = await determineLeadAssignment(session.organization.id, {
      source,
      qualificationScore: scoreResult.score,
      estimatedValue: Number(estimatedValue),
      country,
      ownerId,
    });

    // 3. Create lead record
    const lead = await prisma.lead.create({
      data: {
        organizationId: session.organization.id,
        firstName,
        lastName: lastName || '',
        email: email || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        companyName: companyName || null,
        jobTitle: jobTitle || null,
        website: website || null,
        industry: industry || null,
        city: city || null,
        state: state || null,
        country: country || null,
        source,
        sourceCampaign: sourceCampaign || null,
        sourceChannel: sourceChannel || null,
        ownerId: assignment.assignedOwnerId,
        teamId: assignment.assignedTeamId,
        priority,
        qualificationScore: scoreResult.score,
        interestedProduct: interestedProduct || null,
        estimatedValue: Number(estimatedValue) || 0,
        notes: notes || null,
        tags: Array.isArray(tags) ? tags : [],
        createdById: session.user.id,
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // 4. Log scoring explanation
    if (scoreResult.explanations.length > 0) {
      await prisma.leadScoringLog.create({
        data: {
          leadId: lead.id,
          scoreBefore: 0,
          scoreAfter: scoreResult.score,
          reason: scoreResult.explanations.join('; '),
        },
      });
    }

    // 5. Record initial interaction timeline
    await prisma.interaction.create({
      data: {
        organizationId: session.organization.id,
        leadId: lead.id,
        actorId: session.user.id,
        type: 'NOTE',
        summary: `Lead created (${source})`,
        body: notes || `Created and assigned via ${assignment.strategyUsed}: ${assignment.reason}`,
      },
    });

    // 6. Trigger automations
    await processAutomations({
      organizationId: session.organization.id,
      triggerType: 'LEAD_CREATED',
      entityType: 'LEAD',
      entityId: lead.id,
      actorId: session.user.id,
      data: {
        ...lead,
        priority: lead.priority,
        source: lead.source,
        status: lead.status,
      },
    });

    // 7. Audit log
    await logAuditEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'LEAD',
      entityId: lead.id,
      newData: { firstName: lead.firstName, lastName: lead.lastName, email: lead.email },
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create lead' }, { status: 500 });
  }
}
