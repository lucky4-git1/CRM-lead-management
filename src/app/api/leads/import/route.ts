import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { processLeadsImport } from '@/lib/csv-handler';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasPermission(session.user.role, 'leads:import')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { csvContent } = await req.json();

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json({ error: 'CSV content is required' }, { status: 400 });
    }

    const result = await processLeadsImport(session.organization.id, session.user.id, csvContent);

    await logAuditEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      action: 'IMPORT',
      entityType: 'LEAD',
      entityId: `import-${Date.now()}`,
      newData: {
        totalRows: result.totalRows,
        importedCount: result.importedCount,
        duplicateCount: result.duplicateCount,
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Import failed' }, { status: 500 });
  }
}
