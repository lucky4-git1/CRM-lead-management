import { describe, it, expect } from 'vitest';
import { hasPermission } from '@/lib/rbac';

describe('Role-Based Access Control (RBAC)', () => {
  it('OWNER should have full administrative permissions', () => {
    expect(hasPermission('OWNER', 'leads:read')).toBe(true);
    expect(hasPermission('OWNER', 'leads:create')).toBe(true);
    expect(hasPermission('OWNER', 'leads:delete')).toBe(true);
    expect(hasPermission('OWNER', 'leads:export')).toBe(true);
    expect(hasPermission('OWNER', 'settings:manage')).toBe(true);
    expect(hasPermission('OWNER', 'audit:read')).toBe(true);
  });

  it('SALES_REP should be able to manage leads and deals but NOT delete leads or configure settings', () => {
    expect(hasPermission('SALES_REP', 'leads:read')).toBe(true);
    expect(hasPermission('SALES_REP', 'leads:create')).toBe(true);
    expect(hasPermission('SALES_REP', 'leads:update')).toBe(true);
    expect(hasPermission('SALES_REP', 'deals:manage')).toBe(true);

    expect(hasPermission('SALES_REP', 'leads:delete')).toBe(false);
    expect(hasPermission('SALES_REP', 'settings:manage')).toBe(false);
    expect(hasPermission('SALES_REP', 'audit:read')).toBe(false);
  });

  it('READ_ONLY should only be able to view, not mutate or export data', () => {
    expect(hasPermission('READ_ONLY', 'leads:read')).toBe(true);
    expect(hasPermission('READ_ONLY', 'deals:read')).toBe(true);
    expect(hasPermission('READ_ONLY', 'analytics:read')).toBe(true);

    expect(hasPermission('READ_ONLY', 'leads:create')).toBe(false);
    expect(hasPermission('READ_ONLY', 'leads:update')).toBe(false);
    expect(hasPermission('READ_ONLY', 'leads:export')).toBe(false);
    expect(hasPermission('READ_ONLY', 'deals:manage')).toBe(false);
  });
});
