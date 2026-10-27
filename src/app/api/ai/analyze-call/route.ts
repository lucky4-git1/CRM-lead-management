import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { AIService } from '@/lib/ai-service';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript or call notes are required' }, { status: 400 });
    }

    const analysis = AIService.analyzeCallTranscript(transcript);

    return NextResponse.json({ success: true, analysis });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Call analysis failed' }, { status: 500 });
  }
}
