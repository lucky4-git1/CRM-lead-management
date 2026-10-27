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

  const company = await prisma.company.findFirst({
    where: { id, organizationId: session.organization.id },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true } },
      contacts: true,
      deals: {
        include: { stage: true },
      },
      tasks: true,
      interactions: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  return NextResponse.json({ company });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'companies:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const company = await prisma.company.update({
    where: { id },
    data: body,
  });

  return NextResponse.json({ success: true, company });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'companies:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  await prisma.company.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
