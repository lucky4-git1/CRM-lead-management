import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'crm-production-secret-default-key-2026';

export interface TokenPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    timezone: string;
  };
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('crm_token')?.value;

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId || !decoded.organizationId) return null;

  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: decoded.organizationId,
        userId: decoded.userId,
      },
    },
    include: {
      user: true,
      organization: true,
    },
  });

  if (!membership || !membership.user.isActive) return null;

  return {
    user: {
      id: membership.user.id,
      email: membership.user.email,
      firstName: membership.user.firstName,
      lastName: membership.user.lastName,
      role: membership.role,
    },
    organization: {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      currency: membership.organization.currency,
      timezone: membership.organization.timezone,
    },
  };
}
