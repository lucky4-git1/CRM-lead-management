import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1x1 transparent GIF bytes
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (lead) {
      await prisma.interaction.create({
        data: {
          organizationId: lead.organizationId,
          leadId: lead.id,
          type: 'EMAIL',
          direction: 'INBOUND',
          summary: 'Email opened by lead',
          body: 'Recipient opened tracked sales email message.',
        },
      });
    }
  } catch (err) {
    console.error('Email tracking error:', err);
  }

  return new NextResponse(TRANSPARENT_GIF_BUFFER, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
