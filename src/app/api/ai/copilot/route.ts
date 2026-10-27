import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { AIService } from '@/lib/ai-service';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { leadName, companyName, jobTitle, intent, channel = 'EMAIL', customInstructions } = body;

    if (!leadName || !intent) {
      return NextResponse.json({ error: 'leadName and intent are required' }, { status: 400 });
    }

    const draft = AIService.generateSalesDraft({
      leadName,
      companyName,
      jobTitle,
      intent,
      channel,
      customInstructions,
      salesRepName: `${session.user.firstName} ${session.user.lastName}`,
    });

    return NextResponse.json({ success: true, draft });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 });
  }
}
