import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { IntegrationProvider } from '@prisma/client';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accounts = await prisma.integrationAccount.findMany({
    where: { organizationId: session.organization.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ accounts });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'integrations:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { provider, name, credentials = {}, settings = {} } = body;

    const account = await prisma.integrationAccount.create({
      data: {
        organizationId: session.organization.id,
        provider: provider as IntegrationProvider,
        name: name || `${provider} Account`,
        credentials,
        settings,
        status: 'CONNECTED',
      },
    });

    return NextResponse.json({ success: true, account }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to configure integration' }, { status: 500 });
  }
}
