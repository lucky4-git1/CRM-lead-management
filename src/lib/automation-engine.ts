import { prisma } from './prisma';
import { TriggerType } from '@prisma/client';

export interface AutomationContext {
  organizationId: string;
  triggerType: TriggerType;
  entityType: 'LEAD' | 'DEAL' | 'TASK';
  entityId: string;
  data: Record<string, any>;
  actorId?: string;
}

export async function processAutomations(ctx: AutomationContext): Promise<void> {
  try {
    const rules = await prisma.automationRule.findMany({
      where: {
        organizationId: ctx.organizationId,
        isActive: true,
        triggerType: ctx.triggerType,
      },
    });

    for (const rule of rules) {
      const conditions = (rule.conditions as any[]) || [];
      let matches = true;

      for (const cond of conditions) {
        const val = ctx.data[cond.field];
        if (cond.operator === 'equals' && String(val) !== String(cond.value)) {
          matches = false;
          break;
        }
        if (cond.operator === 'not_equals' && String(val) === String(cond.value)) {
          matches = false;
          break;
        }
      }

      if (matches) {
        const actions = (rule.actions as any[]) || [];
        const executedActions: string[] = [];

        for (const action of actions) {
          if (action.type === 'create_task') {
            const dueHours = action.dueHours || 24;
            const dueDate = new Date(Date.now() + dueHours * 3600000);

            await prisma.task.create({
              data: {
                organizationId: ctx.organizationId,
                title: action.title || `Automated Task: Follow up on ${ctx.entityType.toLowerCase()}`,
                description: `Created automatically by rule: ${rule.name}`,
                priority: action.priority || 'MEDIUM',
                status: 'PENDING',
                dueDate,
                assignedToId: ctx.data.ownerId || ctx.actorId || null,
                leadId: ctx.entityType === 'LEAD' ? ctx.entityId : null,
                dealId: ctx.entityType === 'DEAL' ? ctx.entityId : null,
              },
            });
            executedActions.push(`Created task: ${action.title}`);
          }

          if (action.type === 'send_notification') {
            // Log interaction as automated notification
            await prisma.interaction.create({
              data: {
                organizationId: ctx.organizationId,
                type: 'AUTOMATION',
                summary: action.message || `Notification: ${rule.name} triggered`,
                leadId: ctx.entityType === 'LEAD' ? ctx.entityId : null,
                dealId: ctx.entityType === 'DEAL' ? ctx.entityId : null,
                metadata: { ruleId: rule.id, ruleName: rule.name },
              },
            });
            executedActions.push(`Logged notification`);
          }

          if (action.type === 'add_tag' && ctx.entityType === 'LEAD') {
            const tag = action.tag;
            if (tag && Array.isArray(ctx.data.tags) && !ctx.data.tags.includes(tag)) {
              await prisma.lead.update({
                where: { id: ctx.entityId },
                data: { tags: { push: tag } },
              });
              executedActions.push(`Added tag: ${tag}`);
            }
          }
        }

        // Record execution log and increment rule count
        await prisma.automationRule.update({
          where: { id: rule.id },
          data: {
            executionCount: { increment: 1 },
            lastExecutedAt: new Date(),
          },
        });

        await prisma.automationExecutionLog.create({
          data: {
            organizationId: ctx.organizationId,
            ruleId: rule.id,
            triggerType: ctx.triggerType,
            entityType: ctx.entityType,
            entityId: ctx.entityId,
            status: 'SUCCESS',
            details: { executedActions },
          },
        });
      }
    }
  } catch (err: any) {
    console.error('Error executing automations:', err);
  }
}
