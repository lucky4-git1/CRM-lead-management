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
      { name: { contains: search, mode: 'insensitive' } },
      { domain: { contains: search, mode: 'insensitive' } },
      { industry: { contains: search, mode: 'insensitive' } },
    ];
  }

  const companies = await prisma.company.findMany({
    where: whereClause,
    include: {
      owner: { select: { id: true, firstName: true, lastName: true } },
      contacts: { select: { id: true, firstName: true, lastName: true, email: true } },
      deals: { select: { id: true, title: true, amount: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ companies });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'companies:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, domain, industry, size, website, phone, address, city, state, country, annualRevenue } = body;

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        organizationId: session.organization.id,
        name,
        domain: domain || null,
        industry: industry || null,
        size: size || null,
        website: website || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : null,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, company }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create company' }, { status: 500 });
  }
}
