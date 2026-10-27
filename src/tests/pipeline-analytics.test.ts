import { describe, it, expect, vi } from 'vitest';
import { calculatePipelineMetrics } from '@/lib/pipeline-analytics';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pipeline: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'pipe-1',
        name: 'Standard Pipeline',
        stages: [
          { id: 's1', name: 'New', stageOrder: 1, color: '#3b82f6' },
          { id: 's2', name: 'Proposal', stageOrder: 2, color: '#f59e0b' },
          { id: 's3', name: 'Won', stageOrder: 3, color: '#10b981' },
          { id: 's4', name: 'Lost', stageOrder: 4, color: '#ef4444' },
        ],
      }),
    },
    deal: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'd1', amount: 50000, probability: 50, status: 'OPEN', stageId: 's2' },
        { id: 'd2', amount: 30000, probability: 20, status: 'OPEN', stageId: 's1' },
        { id: 'd3', amount: 100000, probability: 100, status: 'WON', stageId: 's3' },
        { id: 'd4', amount: 20000, probability: 0, status: 'LOST', stageId: 's4' },
      ]),
    },
  },
}));

describe('Sales Pipeline Analytics Calculations', () => {
  it('should accurately compute total open pipeline value and weighted pipeline value', async () => {
    const metrics = await calculatePipelineMetrics('org-123');

    // Total open = 50,000 + 30,000 = 80,000
    expect(metrics.totalPipelineValue).toBe(80000);
    // Weighted = 50,000 * 0.5 + 30,000 * 0.2 = 25,000 + 6,000 = 31,000
    expect(metrics.weightedPipelineValue).toBe(31000);
  });

  it('should compute won revenue and win rate accurately', async () => {
    const metrics = await calculatePipelineMetrics('org-123');

    // Won revenue = 100,000
    expect(metrics.wonRevenue).toBe(100000);
    // Finished = 1 Won + 1 Lost = 2 deals. Win rate = 1 / 2 = 50%
    expect(metrics.winRate).toBe(50);
  });
});
