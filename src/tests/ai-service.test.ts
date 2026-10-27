import { describe, it, expect } from 'vitest';
import { AIService } from '@/lib/ai-service';

describe('AI Sales Intelligence & Copilot Engine', () => {
  it('should generate personalized email pitch with demo intent and correct merge context', () => {
    const draft = AIService.generateSalesDraft({
      leadName: 'Robert Chen',
      companyName: 'Apex Technologies',
      jobTitle: 'VP of Product',
      intent: 'DEMO_INVITE',
      channel: 'EMAIL',
      salesRepName: 'Alex Mercer',
    });

    expect(draft.subject).toContain('Apex Technologies');
    expect(draft.body).toContain('Hi Robert');
    expect(draft.body).toContain('Alex Mercer');
    expect(draft.tone).toContain('Professional');
  });

  it('should generate concise WhatsApp message draft with conversational tone', () => {
    const draft = AIService.generateSalesDraft({
      leadName: 'Sophia Martinez',
      companyName: 'Lumina Energy',
      intent: 'PRICING_QUOTE',
      channel: 'WHATSAPP',
    });

    expect(draft.body).toContain('Hi Sophia');
    expect(draft.body).toContain('Lumina Energy');
    expect(draft.tone).toContain('Action-oriented');
  });

  it('should analyze call transcripts and classify positive vs negative sentiment with action items', () => {
    const positiveCall = 'Client was super excited about the live WhatsApp integration and confirmed they have budget approved for next month. Need to send the proposal.';
    const analysis = AIService.analyzeCallTranscript(positiveCall);

    expect(analysis.sentiment).toBe('POSITIVE');
    expect(analysis.sentimentScore).toBeGreaterThanOrEqual(70);
    expect(analysis.keyTopics).toContain('WhatsApp Integration');
    expect(analysis.actionItems.length).toBeGreaterThan(0);
  });

  it('should predict deal health and flag stale deals with proactive recommendations', () => {
    const health = AIService.evaluateDealHealth({
      amount: 150000,
      probability: 70,
      createdAt: new Date(Date.now() - 30 * 86400000),
      updatedAt: new Date(Date.now() - 10 * 86400000), // 10 days stale
      status: 'OPEN',
      interactionsCount: 4,
    });

    expect(health.staleDays).toBe(10);
    expect(health.factors.some((f) => f.includes('last 10 days'))).toBe(true);
    expect(health.recommendedAction).toBeDefined();
  });
});
