import Papa from 'papaparse';
import { prisma } from './prisma';

/**
 * Sanitizes a CSV string cell against Spreadsheet Formula Injection (CSV Injection).
 * Any cell starting with '=', '+', '-', '@', '\t', or '\r' is prefixed with a single quote.
 */
export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export interface ImportLeadRow {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  source?: string;
  estimatedValue?: number;
  notes?: string;
}

export interface ImportResult {
  totalRows: number;
  importedCount: number;
  duplicateCount: number;
  errorCount: number;
  errors: { row: number; message: string }[];
}

export async function processLeadsImport(
  organizationId: string,
  createdById: string,
  csvContent: string
): Promise<ImportResult> {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const totalRows = parsed.data.length;
  let importedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const rowNum = i + 2; // header is row 1

    const firstName = row['First Name'] || row['firstName'] || row['firstname'] || row['Name']?.split(' ')[0];
    const lastName = row['Last Name'] || row['lastName'] || row['lastname'] || row['Name']?.split(' ').slice(1).join(' ') || 'Lead';
    const email = (row['Email'] || row['email'] || '').trim().toLowerCase();
    const phone = (row['Phone'] || row['phone'] || '').trim();
    const companyName = row['Company'] || row['companyName'] || row['company'];
    const jobTitle = row['Job Title'] || row['jobTitle'] || row['title'];
    const estimatedValue = parseFloat(row['Value'] || row['estimatedValue'] || '0') || 0;
    const sourceRaw = (row['Source'] || row['source'] || 'WEBSITE').toUpperCase();

    if (!firstName) {
      errorCount++;
      errors.push({ row: rowNum, message: 'First name is required.' });
      continue;
    }

    // Check duplicate
    if (email || phone) {
      const existing = await prisma.lead.findFirst({
        where: {
          organizationId,
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
      });

      if (existing) {
        duplicateCount++;
        errors.push({ row: rowNum, message: `Duplicate found with email '${email}' or phone '${phone}'. Skipped.` });
        continue;
      }
    }

    try {
      await prisma.lead.create({
        data: {
          organizationId,
          firstName: sanitizeCsvCell(firstName),
          lastName: sanitizeCsvCell(lastName),
          email: email || null,
          phone: phone || null,
          companyName: companyName ? sanitizeCsvCell(companyName) : null,
          jobTitle: jobTitle ? sanitizeCsvCell(jobTitle) : null,
          estimatedValue,
          source: ['WEBSITE', 'SOCIAL', 'WHATSAPP', 'SMS', 'PHONE_CALL', 'REFERRAL', 'OUTBOUND'].includes(sourceRaw)
            ? (sourceRaw as any)
            : 'OTHER',
          createdById,
          qualificationScore: 30,
        },
      });
      importedCount++;
    } catch (err: any) {
      errorCount++;
      errors.push({ row: rowNum, message: err.message || 'Failed to insert lead' });
    }
  }

  return {
    totalRows,
    importedCount,
    duplicateCount,
    errorCount,
    errors,
  };
}

export function generateLeadsCsv(leads: any[]): string {
  const rows = leads.map((l) => ({
    'Lead ID': sanitizeCsvCell(l.id),
    'First Name': sanitizeCsvCell(l.firstName),
    'Last Name': sanitizeCsvCell(l.lastName),
    'Email': sanitizeCsvCell(l.email),
    'Phone': sanitizeCsvCell(l.phone),
    'Company': sanitizeCsvCell(l.companyName),
    'Job Title': sanitizeCsvCell(l.jobTitle),
    'Status': sanitizeCsvCell(l.status),
    'Priority': sanitizeCsvCell(l.priority),
    'Score': l.qualificationScore,
    'Estimated Value': l.estimatedValue,
    'Source': sanitizeCsvCell(l.source),
    'Owner': sanitizeCsvCell(l.owner ? `${l.owner.firstName} ${l.owner.lastName}` : 'Unassigned'),
    'Created At': l.createdAt ? new Date(l.createdAt).toISOString() : '',
  }));

  return Papa.unparse(rows);
}
