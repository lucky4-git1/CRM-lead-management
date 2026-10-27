import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = session.organization.id;

  const members = await prisma.membership.findMany({
    where: {
      organizationId: orgId,
      user: { isActive: true },
    },
    include: {
      user: true,
      team: true,
    },
  });

  const performanceList = await Promise.all(
    members.map(async (m) => {
      const userId = m.user.id;
      const [
        assignedLeadsCount,
        convertedLeadsCount,
        openDeals,
        wonDeals,
        completedTasksCount,
        interactionsCount,
      ] = await Promise.all([
        prisma.lead.count({ where: { organizationId: orgId, ownerId: userId, isArchived: false } }),
        prisma.lead.count({ where: { organizationId: orgId, ownerId: userId, status: 'CONVERTED' } }),
        prisma.deal.findMany({ where: { organizationId: orgId, ownerId: userId, status: 'OPEN' } }),
        prisma.deal.findMany({ where: { organizationId: orgId, ownerId: userId, status: 'WON' } }),
        prisma.task.count({ where: { organizationId: orgId, assignedToId: userId, status: 'COMPLETED' } }),
        prisma.interaction.count({ where: { organizationId: orgId, actorId: userId } }),
      ]);

      const openDealsValue = openDeals.reduce((sum, d) => sum + d.amount, 0);
      const wonDealsValue = wonDeals.reduce((sum, d) => sum + d.amount, 0);
      const conversionRate = assignedLeadsCount > 0 ? Math.round((convertedLeadsCount / assignedLeadsCount) * 100) : 0;

      return {
        userId,
        name: `${m.user.firstName} ${m.user.lastName}`,
        email: m.user.email,
        role: m.role,
        teamName: m.team?.name || 'General Sales',
        assignedLeadsCount,
        convertedLeadsCount,
        conversionRate,
        openDealsCount: openDeals.length,
        openDealsValue,
        wonDealsCount: wonDeals.length,
        wonDealsValue,
        completedTasksCount,
        interactionsCount,
      };
    })
  );

  performanceList.sort((a, b) => b.wonDealsValue - a.wonDealsValue);

  return NextResponse.json({ performance: performanceList });
}
