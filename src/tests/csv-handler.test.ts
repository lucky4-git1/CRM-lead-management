import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell, generateLeadsCsv } from '@/lib/csv-handler';

describe('CSV Security & Formula Injection Protections', () => {
  it('should neutralize cells starting with dangerous spreadsheet formula triggers (=, +, -, @, \\t, \\r)', () => {
    expect(sanitizeCsvCell('=1+1')).toBe("'=1+1");
    expect(sanitizeCsvCell('+cmd|')).toBe("'+cmd|");
    expect(sanitizeCsvCell('-2+5')).toBe("'-2+5");
    expect(sanitizeCsvCell('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
    expect(sanitizeCsvCell('\tmalicious')).toBe("'\tmalicious");
  });

  it('should preserve safe strings intact', () => {
    expect(sanitizeCsvCell('John')).toBe('John');
    expect(sanitizeCsvCell('john.doe@example.com')).toBe('john.doe@example.com');
    expect(sanitizeCsvCell('Acme Corp')).toBe('Acme Corp');
    expect(sanitizeCsvCell(100)).toBe('100');
  });

  it('should generate valid sanitized CSV with appropriate column headers', () => {
    const mockLeads = [
      {
        id: 'lead-1',
        firstName: 'Alice',
        lastName: '=Smith',
        email: 'alice@example.com',
        phone: '+1-555-0199',
        companyName: 'TechCorp',
        jobTitle: 'Director',
        status: 'QUALIFIED',
        priority: 'HIGH',
        qualificationScore: 85,
        estimatedValue: 45000,
        source: 'WEBSITE',
        owner: { firstName: 'Alex', lastName: 'Mercer' },
        createdAt: new Date('2026-01-01'),
      },
    ];

    const csv = generateLeadsCsv(mockLeads);
    expect(csv).toContain('Lead ID');
    expect(csv).toContain('First Name');
    expect(csv).toContain('Alice');
    expect(csv).toContain("'=Smith"); // Escaped formula
  });
});
