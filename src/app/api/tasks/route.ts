import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { TaskType, TaskPriority } from '@prisma/client';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const assignedToId = searchParams.get('assignedToId');
  const filter = searchParams.get('filter'); // 'today', 'overdue', 'my'

  const whereClause: any = {
    organizationId: session.organization.id,
  };

  const now = new Date();

  if (filter === 'overdue') {
    whereClause.dueDate = { lt: now };
    whereClause.status = 'PENDING';
  } else if (filter === 'my') {
    whereClause.assignedToId = session.user.id;
  }

  if (status && status !== 'ALL' && filter !== 'overdue') {
    whereClause.status = status;
  }

  if (assignedToId && assignedToId !== 'ALL') {
    whereClause.assignedToId = assignedToId;
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
      deal: { select: { id: true, title: true, amount: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      company: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'tasks:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      taskType = 'FOLLOW_UP',
      priority = 'MEDIUM',
      dueDate,
      dueTime,
      assignedToId,
      leadId,
      dealId,
      contactId,
      companyId,
    } = body;

    if (!title || !dueDate) {
      return NextResponse.json({ error: 'Title and due date are required' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        organizationId: session.organization.id,
        title,
        description: description || null,
        taskType: taskType as TaskType,
        priority: priority as TaskPriority,
        dueDate: new Date(dueDate),
        dueTime: dueTime || null,
        assignedToId: assignedToId || session.user.id,
        createdById: session.user.id,
        leadId: leadId || null,
        dealId: dealId || null,
        contactId: contactId || null,
        companyId: companyId || null,
        status: 'PENDING',
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create task' }, { status: 500 });
  }
}
