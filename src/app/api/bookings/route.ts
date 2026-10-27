import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bookings = await prisma.meetingBooking.findMany({
    where: { organizationId: session.organization.id },
    orderBy: { scheduledAt: 'asc' },
  });

  return NextResponse.json({ bookings });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      organizationSlug = 'acme',
      title = 'Discovery & Product Architecture Demo',
      scheduledAt,
      guestName,
      guestEmail,
      guestPhone,
      guestNotes,
      durationMinutes = 30,
    } = body;

    if (!guestName || !guestEmail || !scheduledAt) {
      return NextResponse.json({ error: 'guestName, guestEmail, and scheduledAt are required' }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
    });

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const booking = await prisma.meetingBooking.create({
      data: {
        organizationId: org.id,
        title,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: parseInt(durationMinutes, 10),
        guestName,
        guestEmail: guestEmail.toLowerCase().trim(),
        guestPhone,
        guestNotes,
        status: 'CONFIRMED',
      },
    });

    // Auto find or create Lead
    let lead = await prisma.lead.findFirst({
      where: { organizationId: org.id, email: guestEmail.toLowerCase().trim() },
    });

    if (!lead) {
      const parts = guestName.split(' ');
      lead = await prisma.lead.create({
        data: {
          organizationId: org.id,
          firstName: parts[0] || guestName,
          lastName: parts.slice(1).join(' ') || 'Lead',
          email: guestEmail.toLowerCase().trim(),
          phone: guestPhone || null,
          source: 'WEBSITE',
          sourceChannel: 'meeting_scheduler',
          qualificationScore: 60,
          status: 'QUALIFIED',
          notes: `Booked Meeting: ${title}. Notes: ${guestNotes || 'None'}`,
        },
      });
    }

    // Schedule Task
    await prisma.task.create({
      data: {
        organizationId: org.id,
        title: `Meeting with ${guestName} (${title})`,
        description: guestNotes || 'Scheduled via meeting booking portal',
        dueDate: new Date(scheduledAt),
        taskType: 'MEETING',
        priority: 'HIGH',
        leadId: lead.id,
      },
    });

    // Record interaction
    await prisma.interaction.create({
      data: {
        organizationId: org.id,
        leadId: lead.id,
        type: 'MEETING',
        summary: `Scheduled meeting: ${title}`,
        body: `Scheduled for ${new Date(scheduledAt).toLocaleString()} with ${guestName} (${guestEmail})`,
      },
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Booking failed' }, { status: 500 });
  }
}
