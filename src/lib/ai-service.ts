export interface CopilotDraftRequest {
  leadName: string;
  companyName?: string;
  jobTitle?: string;
  source?: string;
  intent: 'DEMO_INVITE' | 'FOLLOW_UP' | 'PRICING_QUOTE' | 'OBJECTION_BUDGET' | 'OBJECTION_TIMING' | 'RE_ENGAGE';
  channel: 'EMAIL' | 'WHATSAPP';
  customInstructions?: string;
  salesRepName?: string;
}

export interface CopilotDraftResponse {
  subject?: string;
  body: string;
  tone: string;
  intentUsed: string;
}

export interface CallAnalysisResult {
  summary: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  sentimentScore: number; // 0 to 100
  keyTopics: string[];
  actionItems: string[];
  recommendedNextStep: string;
}

export interface DealHealthPrediction {
  healthScore: number; // 0 to 100
  status: 'STRONG' | 'AT_RISK' | 'CRITICAL';
  staleDays: number;
  factors: string[];
  recommendedAction: string;
}

export class AIService {
  /**
   * Generates highly-contextualized sales email and WhatsApp follow-up drafts.
   */
  static generateSalesDraft(req: CopilotDraftRequest): CopilotDraftResponse {
    const rep = req.salesRepName || 'Your Account Executive';
    const comp = req.companyName || 'your organization';
    const firstName = req.leadName.split(' ')[0] || 'there';

    if (req.channel === 'WHATSAPP') {
      switch (req.intent) {
        case 'DEMO_INVITE':
          return {
            body: `Hi ${firstName}! Alex from LeadFlow CRM here. Saw your inquiry regarding lead management for ${comp}. Are you available for a quick 10-minute walkthrough via WhatsApp video or Google Meet tomorrow at 2 PM?`,
            tone: 'Conversational & Direct',
            intentUsed: req.intent,
          };
        case 'OBJECTION_BUDGET':
          return {
            body: `Hi ${firstName}, totally understand budget constraints this quarter. We actually offer quarterly payment terms and SMB modular tiers so you only pay for active sales seats. Would it help if I send over our modular pricing sheet?`,
            tone: 'Empathetic & Solution-oriented',
            intentUsed: req.intent,
          };
        case 'PRICING_QUOTE':
          return {
            body: `Hi ${firstName}, I've finalized your custom proposal for ${comp}. It includes full WhatsApp Cloud API routing and 150 team seats. Would you like me to share the secure proposal link right here?`,
            tone: 'Professional & Action-oriented',
            intentUsed: req.intent,
          };
        default:
          return {
            body: `Hi ${firstName}, just checking in to see if you had any questions on our enterprise lead automation workflow? Happy to jump on a quick call whenever convenient for you.`,
            tone: 'Friendly Follow-up',
            intentUsed: req.intent,
          };
      }
    }

    // Email drafts
    switch (req.intent) {
      case 'DEMO_INVITE':
        return {
          subject: `Automating lead routing & response time for ${comp}`,
          body: `Hi ${firstName},\n\nThank you for reaching out to LeadFlow CRM!\n\nGiven your role ${req.jobTitle ? `as ${req.jobTitle} ` : ''}at ${comp}, I wanted to share how we helped similar teams reduce inbound lead response times from 4 hours to under 3 minutes using automated WhatsApp and round-robin routing.\n\nDo you have 15 minutes this Thursday or Friday for a brief live demonstration tailored to ${comp}'s sales pipeline?\n\nYou can also pick a convenient slot directly on my calendar: https://crm.internal/book/alex-rep\n\nWarm regards,\n${rep}\nLeadFlow Enterprise Solutions`,
          tone: 'Professional & Consultative',
          intentUsed: req.intent,
        };

      case 'OBJECTION_BUDGET':
        return {
          subject: `Flexible deployment terms for ${comp}`,
          body: `Hi ${firstName},\n\nI completely understand that budget cycles and capital expenditure require rigorous justification right now.\n\nTo make this frictionless for ${comp}, we can structure your deployment with phased onboarding, allowing you to start with your core enterprise reps and expand as pipeline revenue scales.\n\nWould a 10-minute touchpoint this week be helpful to review our phased pricing models?\n\nBest regards,\n${rep}`,
          tone: 'Empathetic & Value-Focused',
          intentUsed: req.intent,
        };

      case 'PRICING_QUOTE':
        return {
          subject: `Proposal & Architecture Specification: ${comp}`,
          body: `Hi ${firstName},\n\nFollowing our technical architecture review, I have prepared proposal QUO-2026-0041 tailored for ${comp}.\n\nHighlights:\n- Full multi-tenant isolation and SOC2 Type II compliance guarantees\n- In-browser WebRTC VoIP softphone and WhatsApp Cloud API integration\n- Guaranteed 99.99% uptime SLA\n\nYou can review, configure, and sign the proposal digitally here:\nhttps://crm.internal/deals/proposal\n\nPlease let me know if you would like to review the line items together.\n\nSincerely,\n${rep}`,
          tone: 'Executive & Clear',
          intentUsed: req.intent,
        };

      default:
        return {
          subject: `Checking in on ${comp}'s CRM evaluation`,
          body: `Hi ${firstName},\n\nHope your week is off to a productive start!\n\nI wanted to follow up and see if your team had any questions on the evaluation environment we configured for ${comp}.\n\nLet me know if you'd like to dive deeper into any specific integrations or reporting dashboards.\n\nWarm regards,\n${rep}`,
          tone: 'Helpful & Courteous',
          intentUsed: req.intent,
        };
    }
  }

  /**
   * Analyzes meeting notes or call transcripts, extracting sentiment and action items.
   */
  static analyzeCallTranscript(text: string): CallAnalysisResult {
    const lower = text.toLowerCase();

    // Sentiment detection
    let sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
    let sentimentScore = 65;

    const positiveWords = ['interested', 'excited', 'demo', 'approved', 'ready', 'great', 'love', 'perfect', 'budget', 'agreed', 'urgent'];
    const negativeWords = ['expensive', 'unhappy', 'competitor', 'delayed', 'no budget', 'cancelled', 'not interested', 'frustrated'];

    let posCount = 0;
    let negCount = 0;

    positiveWords.forEach((w) => {
      if (lower.includes(w)) posCount++;
    });
    negativeWords.forEach((w) => {
      if (lower.includes(w)) negCount++;
    });

    if (posCount > negCount) {
      sentiment = 'POSITIVE';
      sentimentScore = Math.min(95, 60 + posCount * 10);
    } else if (negCount > posCount) {
      sentiment = 'NEGATIVE';
      sentimentScore = Math.max(20, 50 - negCount * 12);
    }

    // Extract topics
    const keyTopics: string[] = [];
    if (lower.includes('whatsapp') || lower.includes('chat')) keyTopics.push('WhatsApp Integration');
    if (lower.includes('budget') || lower.includes('pricing') || lower.includes('cost')) keyTopics.push('Pricing & License Costs');
    if (lower.includes('migration') || lower.includes('legacy')) keyTopics.push('CRM Migration & Onboarding');
    if (lower.includes('seats') || lower.includes('team') || lower.includes('reps')) keyTopics.push('Team Capacity & Scalability');
    if (lower.includes('security') || lower.includes('soc2') || lower.includes('compliance')) keyTopics.push('Enterprise Security & Compliance');

    if (keyTopics.length === 0) keyTopics.push('General Product Overview', 'Feature Requirements');

    // Action items
    const actionItems: string[] = [];
    if (lower.includes('send') || lower.includes('share') || lower.includes('proposal')) {
      actionItems.push('Deliver customized proposal and ROI breakdown');
    }
    if (lower.includes('demo') || lower.includes('schedule') || lower.includes('tomorrow')) {
      actionItems.push('Prepare live demonstration for sales leadership team');
    }
    if (actionItems.length === 0) {
      actionItems.push('Schedule follow-up touchpoint within 48 hours', 'Log discussion notes on customer profile');
    }

    return {
      summary: text.length > 120 ? `${text.slice(0, 120)}...` : text,
      sentiment,
      sentimentScore,
      keyTopics,
      actionItems,
      recommendedNextStep:
        sentiment === 'POSITIVE'
          ? 'Fast-track proposal delivery and schedule decision-maker executive review'
          : 'Address technical objections and share customer case studies',
    };
  }

  /**
   * Evaluates deal health, stage duration, and predicts likelihood of winning.
   */
  static evaluateDealHealth(deal: {
    amount: number;
    probability: number;
    createdAt: Date | string;
    updatedAt: Date | string;
    status: string;
    interactionsCount?: number;
  }): DealHealthPrediction {
    const updated = new Date(deal.updatedAt);
    const now = new Date();
    const staleDays = Math.max(0, Math.floor((now.getTime() - updated.getTime()) / 86400000));

    let healthScore = deal.probability;
    const factors: string[] = [];

    if (staleDays > 7) {
      healthScore -= 20;
      factors.push(`No activity in the last ${staleDays} days (-20)`);
    } else {
      healthScore += 10;
      factors.push('Active customer touchpoints within the last 7 days (+10)');
    }

    if ((deal.interactionsCount || 0) >= 3) {
      healthScore += 15;
      factors.push('Strong engagement depth with 3+ logged interactions (+15)');
    }

    if (deal.amount >= 100000) {
      factors.push('Tier-1 Enterprise Deal size ($100k+) requires executive sponsor alignment');
    }

    healthScore = Math.max(5, Math.min(98, healthScore));

    const status = healthScore >= 70 ? 'STRONG' : healthScore >= 40 ? 'AT_RISK' : 'CRITICAL';

    return {
      healthScore,
      status,
      staleDays,
      factors,
      recommendedAction:
        status === 'STRONG'
          ? 'Maintain momentum: Send contract and request procurement timeline'
          : status === 'AT_RISK'
          ? 'Action required: Re-engage primary champion via WhatsApp or phone call'
          : 'Urgent intervention: Escalate to Sales Director for executive outreach',
    };
  }
}
