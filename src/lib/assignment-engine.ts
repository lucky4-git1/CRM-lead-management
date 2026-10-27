import { prisma } from './prisma';

export interface AssignmentResult {
  assignedOwnerId: string | null;
  assignedTeamId: string | null;
  strategyUsed: string;
  reason: string;
}

export async function determineLeadAssignment(
  organizationId: string,
  lead: {
    source: string;
    qualificationScore: number;
    estimatedValue?: number;
    country?: string | null;
    ownerId?: string | null;
  }
): Promise<AssignmentResult> {
  // If explicitly assigned manually
  if (lead.ownerId) {
    return {
      assignedOwnerId: lead.ownerId,
      assignedTeamId: null,
      strategyUsed: 'MANUAL',
      reason: 'Assigned manually by user',
    };
  }

  // Fetch active assignment rules
  const rules = await prisma.leadAssignmentRule.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    orderBy: { priority: 'asc' },
  });

  for (const rule of rules) {
    const conditions = (rule.conditions as Record<string, any>) || {};
    let matches = true;

    if (conditions.source && conditions.source !== lead.source) {
      matches = false;
    }
    if (conditions.qualificationScoreMin && lead.qualificationScore < conditions.qualificationScoreMin) {
      matches = false;
    }

    if (matches) {
      if (rule.strategy === 'ROUND_ROBIN' && rule.roundRobinUserIds && rule.roundRobinUserIds.length > 0) {
        const pool = rule.roundRobinUserIds;
        let nextIndex = 0;
        if (rule.lastAssignedUserId) {
          const lastIdx = pool.indexOf(rule.lastAssignedUserId);
          if (lastIdx !== -1) {
            nextIndex = (lastIdx + 1) % pool.length;
          }
        }
        const chosenUser = pool[nextIndex];

        // Update rule last assigned user
        await prisma.leadAssignmentRule.update({
          where: { id: rule.id },
          data: { lastAssignedUserId: chosenUser },
        });

        return {
          assignedOwnerId: chosenUser,
          assignedTeamId: rule.assignToTeamId || null,
          strategyUsed: 'ROUND_ROBIN',
          reason: `Matched rule: ${rule.name} (Round-robin)`,
        };
      }

      if (rule.strategy === 'LEAST_ACTIVE') {
        // Find sales reps in org and count active leads
        const reps = await prisma.membership.findMany({
          where: {
            organizationId,
            role: { in: ['SALES_REP', 'SALES_MANAGER'] },
            user: { isActive: true },
          },
          select: { userId: true },
        });

        if (reps.length > 0) {
          const userCounts = await Promise.all(
            reps.map(async (r) => {
              const count = await prisma.lead.count({
                where: {
                  organizationId,
                  ownerId: r.userId,
                  status: { in: ['NEW', 'CONTACTED', 'QUALIFIED', 'NURTURING'] },
                },
              });
              return { userId: r.userId, count };
            })
          );

          userCounts.sort((a, b) => a.count - b.count);
          const chosen = userCounts[0].userId;

          return {
            assignedOwnerId: chosen,
            assignedTeamId: rule.assignToTeamId || null,
            strategyUsed: 'LEAST_ACTIVE',
            reason: `Matched rule: ${rule.name} (Least active rep with ${userCounts[0].count} leads)`,
          };
        }
      }

      if (rule.assignToUserId) {
        return {
          assignedOwnerId: rule.assignToUserId,
          assignedTeamId: rule.assignToTeamId || null,
          strategyUsed: rule.strategy,
          reason: `Matched rule: ${rule.name}`,
        };
      }

      if (rule.assignToTeamId) {
        return {
          assignedOwnerId: null,
          assignedTeamId: rule.assignToTeamId,
          strategyUsed: 'BY_TEAM',
          reason: `Assigned to team by rule: ${rule.name}`,
        };
      }
    }
  }

  // Fallback to any active sales rep in the organization
  const fallbackRep = await prisma.membership.findFirst({
    where: {
      organizationId,
      role: { in: ['SALES_REP', 'SALES_MANAGER', 'OWNER'] },
      user: { isActive: true },
    },
    select: { userId: true },
  });

  return {
    assignedOwnerId: fallbackRep?.userId || null,
    assignedTeamId: null,
    strategyUsed: 'DEFAULT_FALLBACK',
    reason: 'Default organization routing fallback',
  };
}
