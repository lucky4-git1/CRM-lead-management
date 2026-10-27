import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const { organizationName, firstName, lastName, email, password } = await req.json();

    if (!organizationName || !firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30) + '-' + Math.floor(1000 + Math.random() * 9000);

    const passwordHash = await hashPassword(password);

    // Create organization, user, default pipeline, and stages in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          memberships: {
            create: {
              organizationId: org.id,
              role: 'OWNER',
            },
          },
        },
      });

      // Default pipeline & stages
      await tx.pipeline.create({
        data: {
          organizationId: org.id,
          name: 'Standard Pipeline',
          isDefault: true,
          stages: {
            create: [
              { name: 'New', stageOrder: 1, winProbability: 10, color: '#3b82f6' },
              { name: 'Contacted', stageOrder: 2, winProbability: 25, color: '#6366f1' },
              { name: 'Qualified', stageOrder: 3, winProbability: 50, color: '#8b5cf6' },
              { name: 'Proposal', stageOrder: 4, winProbability: 75, color: '#f59e0b' },
              { name: 'Won', stageOrder: 5, winProbability: 100, color: '#10b981', isWon: true },
              { name: 'Lost', stageOrder: 6, winProbability: 0, color: '#ef4444', isLost: true },
            ],
          },
        },
      });

      return { org, user };
    });

    const token = signToken({
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.org.id,
      role: 'OWNER',
    });

    await logAuditEvent({
      organizationId: result.org.id,
      userId: result.user.id,
      action: 'REGISTER',
      entityType: 'ORGANIZATION',
      entityId: result.org.id,
      newData: { organizationName, email },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: 'OWNER',
      },
      organization: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
      },
    });

    response.cookies.set('crm_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 });
  }
}
