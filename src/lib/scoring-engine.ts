import { prisma } from './prisma';

export interface ScoreResult {
  score: number;
  explanations: string[];
}

export async function calculateLeadScore(
  organizationId: string,
  lead: {
    jobTitle?: string | null;
    companyName?: string | null;
    source?: string | null;
    estimatedValue?: number | null;
    country?: string | null;
  }
): Promise<ScoreResult> {
  let score = 20; // Baseline starting score
  const explanations: string[] = ['Baseline lead creation (+20)'];

  const rules = await prisma.leadScoringRule.findMany({
    where: {
      organizationId,
      isActive: true,
    },
  });

  for (const rule of rules) {
    let matched = false;

    if (rule.criteriaType === 'JOB_TITLE' && lead.jobTitle) {
      const targets = rule.value.toLowerCase().split(',').map((s) => s.trim());
      const title = lead.jobTitle.toLowerCase();
      matched = targets.some((t) => title.includes(t));
    } else if (rule.criteriaType === 'SOURCE' && lead.source) {
      matched = rule.value.toUpperCase() === lead.source.toUpperCase();
    } else if (rule.criteriaType === 'COMPANY_SIZE' && lead.estimatedValue) {
      if (lead.estimatedValue >= 50000) matched = true;
    }

    if (matched) {
      score += rule.scoreDelta;
      explanations.push(`${rule.name} (${rule.scoreDelta >= 0 ? '+' : ''}${rule.scoreDelta})`);
    }
  }

  score = Math.max(0, Math.min(100, score));

  return { score, explanations };
}
