import { prisma } from './prisma';

export interface PipelineMetrics {
  openDealsCount: number;
  totalPipelineValue: number;
  weightedPipelineValue: number;
  wonRevenue: number;
  lostValue: number;
  winRate: number;
  avgDealSize: number;
  stageBreakdown: {
    stageId: string;
    stageName: string;
    stageOrder: number;
    color: string;
    count: number;
    value: number;
  }[];
}

export async function calculatePipelineMetrics(
  organizationId: string,
  pipelineId?: string
): Promise<PipelineMetrics> {
  const defaultPipeline = pipelineId
    ? await prisma.pipeline.findUnique({
        where: { id: pipelineId },
        include: { stages: { orderBy: { stageOrder: 'asc' } } },
      })
    : await prisma.pipeline.findFirst({
        where: { organizationId, isDefault: true },
        include: { stages: { orderBy: { stageOrder: 'asc' } } },
      });

  if (!defaultPipeline) {
    return {
      openDealsCount: 0,
      totalPipelineValue: 0,
      weightedPipelineValue: 0,
      wonRevenue: 0,
      lostValue: 0,
      winRate: 0,
      avgDealSize: 0,
      stageBreakdown: [],
    };
  }

  const allDeals = await prisma.deal.findMany({
    where: {
      organizationId,
      pipelineId: defaultPipeline.id,
    },
    include: { stage: true },
  });

  let openDealsCount = 0;
  let totalPipelineValue = 0;
  let weightedPipelineValue = 0;
  let wonRevenue = 0;
  let lostValue = 0;
  let wonCount = 0;
  let lostCount = 0;

  for (const deal of allDeals) {
    if (deal.status === 'OPEN') {
      openDealsCount++;
      totalPipelineValue += deal.amount;
      weightedPipelineValue += deal.amount * (deal.probability / 100);
    } else if (deal.status === 'WON') {
      wonCount++;
      wonRevenue += deal.amount;
    } else if (deal.status === 'LOST') {
      lostCount++;
      lostValue += deal.amount;
    }
  }

  const finishedCount = wonCount + lostCount;
  const winRate = finishedCount > 0 ? Math.round((wonCount / finishedCount) * 100) : 0;
  const avgDealSize = allDeals.length > 0 ? Math.round((totalPipelineValue + wonRevenue) / (openDealsCount + wonCount || 1)) : 0;

  const stageBreakdown = defaultPipeline.stages.map((st) => {
    const stageDeals = allDeals.filter((d) => d.stageId === st.id);
    const value = stageDeals.reduce((sum, d) => sum + d.amount, 0);
    return {
      stageId: st.id,
      stageName: st.name,
      stageOrder: st.stageOrder,
      color: st.color,
      count: stageDeals.length,
      value,
    };
  });

  return {
    openDealsCount,
    totalPipelineValue,
    weightedPipelineValue,
    wonRevenue,
    lostValue,
    winRate,
    avgDealSize,
    stageBreakdown,
  };
}
