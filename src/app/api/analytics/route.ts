import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculatePipelineMetrics } from '@/lib/pipeline-analytics';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = session.organization.id;
  const now = new Date();
  const startOfWeek = new Date(now.getTime() - 7 * 86400000);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalLeads,
    leadsToday,
    leadsThisWeek,
    qualifiedLeads,
    unassignedLeads,
    overdueTasks,
    pipelineMetrics,
    leadsBySource,
    leadsByStatus,
  ] = await Promise.all([
    prisma.lead.count({ where: { organizationId: orgId, isArchived: false } }),
    prisma.lead.count({ where: { organizationId: orgId, isArchived: false, createdAt: { gte: startOfDay } } }),
    prisma.lead.count({ where: { organizationId: orgId, isArchived: false, createdAt: { gte: startOfWeek } } }),
    prisma.lead.count({ where: { organizationId: orgId, isArchived: false, status: 'QUALIFIED' } }),
    prisma.lead.count({ where: { organizationId: orgId, isArchived: false, ownerId: null } }),
    prisma.task.count({ where: { organizationId: orgId, status: 'PENDING', dueDate: { lt: now } } }),
    calculatePipelineMetrics(orgId),
    prisma.lead.groupBy({
      by: ['source'],
      where: { organizationId: orgId, isArchived: false },
      _count: { id: true },
      _sum: { estimatedValue: true },
    }),
    prisma.lead.groupBy({
      by: ['status'],
      where: { organizationId: orgId, isArchived: false },
      _count: { id: true },
    }),
  ]);

  const convertedLeads = await prisma.lead.count({ where: { organizationId: orgId, status: 'CONVERTED' } });
  const overallConversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  return NextResponse.json({
    metrics: {
      totalLeads,
      leadsToday,
      leadsThisWeek,
      qualifiedLeads,
      unassignedLeads,
      overdueTasks,
      convertedLeads,
      overallConversionRate,
      pipeline: pipelineMetrics,
      leadsBySource: leadsBySource.map((s) => ({
        source: s.source,
        count: s._count.id,
        estimatedValue: s._sum.estimatedValue || 0,
      })),
      leadsByStatus: leadsByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    },
  });
}
