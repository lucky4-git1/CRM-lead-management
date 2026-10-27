import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  const whereClause: any = {
    organizationId: session.organization.id,
  };

  if (search) {
    whereClause.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const contacts = await prisma.contact.findMany({
    where: whereClause,
    include: {
      company: { select: { id: true, name: true } },
      owner: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ contacts });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'contacts:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, mobile, jobTitle, department, companyId, isPrimary } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First and last name are required' }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        organizationId: session.organization.id,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        mobile: mobile || null,
        jobTitle: jobTitle || null,
        department: department || null,
        companyId: companyId || null,
        isPrimary: !!isPrimary,
        ownerId: session.user.id,
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create contact' }, { status: 500 });
  }
}
