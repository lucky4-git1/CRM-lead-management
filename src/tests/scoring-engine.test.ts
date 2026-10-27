import { describe, it, expect, vi } from 'vitest';
import { calculateLeadScore } from '@/lib/scoring-engine';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    leadScoringRule: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'rule-1',
          name: 'Executive Title',
          criteriaType: 'JOB_TITLE',
          condition: 'CONTAINS',
          value: 'VP,Director,Chief',
          scoreDelta: 25,
        },
        {
          id: 'rule-2',
          name: 'Referral Source',
          criteriaType: 'SOURCE',
          condition: 'EQUALS',
          value: 'REFERRAL',
          scoreDelta: 30,
        },
      ]),
    },
  },
}));

describe('Lead Qualification Scoring Engine', () => {
  it('should calculate baseline score and apply matching rule deltas', async () => {
    const result = await calculateLeadScore('org-123', {
      jobTitle: 'VP of Operations',
      source: 'REFERRAL',
    });

    // Baseline 20 + 25 (VP) + 30 (Referral) = 75
    expect(result.score).toBe(75);
    expect(result.explanations.length).toBe(3);
    expect(result.explanations[1]).toContain('Executive Title');
    expect(result.explanations[2]).toContain('Referral Source');
  });

  it('should clamp scores between 0 and 100', async () => {
    const minResult = await calculateLeadScore('org-123', {
      jobTitle: 'Intern',
      source: 'WEBSITE',
    });
    expect(minResult.score).toBeGreaterThanOrEqual(0);
    expect(minResult.score).toBeLessThanOrEqual(100);
  });
});
