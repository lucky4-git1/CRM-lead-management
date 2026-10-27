import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: { id, organizationId: session.organization.id },
    include: {
      company: true,
      owner: { select: { id: true, firstName: true, lastName: true } },
      deals: true,
      tasks: true,
      interactions: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  return NextResponse.json({ contact });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'contacts:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const contact = await prisma.contact.update({
    where: { id },
    data: body,
  });

  return NextResponse.json({ success: true, contact });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'contacts:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  await prisma.contact.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
