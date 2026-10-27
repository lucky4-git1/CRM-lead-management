import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { organizationId: session.organization.id, isActive: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, sku, unitPrice, description, category = 'SOFTWARE_LICENSE' } = await req.json();

    if (!name || !sku) {
      return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        organizationId: session.organization.id,
        name,
        sku,
        unitPrice: parseFloat(unitPrice) || 0,
        description,
        category,
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
}
