export type RoleType =
  | 'OWNER'
  | 'ADMIN'
  | 'SALES_MANAGER'
  | 'SALES_REP'
  | 'MARKETING'
  | 'SUPPORT'
  | 'READ_ONLY';

export type Permission =
  | 'leads:read'
  | 'leads:create'
  | 'leads:update'
  | 'leads:delete'
  | 'leads:export'
  | 'leads:import'
  | 'leads:assign'
  | 'deals:read'
  | 'deals:manage'
  | 'contacts:manage'
  | 'companies:manage'
  | 'tasks:manage'
  | 'automations:manage'
  | 'integrations:manage'
  | 'analytics:read'
  | 'audit:read'
  | 'settings:manage';

const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  OWNER: [
    'leads:read', 'leads:create', 'leads:update', 'leads:delete', 'leads:export', 'leads:import', 'leads:assign',
    'deals:read', 'deals:manage', 'contacts:manage', 'companies:manage', 'tasks:manage',
    'automations:manage', 'integrations:manage', 'analytics:read', 'audit:read', 'settings:manage',
  ],
  ADMIN: [
    'leads:read', 'leads:create', 'leads:update', 'leads:delete', 'leads:export', 'leads:import', 'leads:assign',
    'deals:read', 'deals:manage', 'contacts:manage', 'companies:manage', 'tasks:manage',
    'automations:manage', 'integrations:manage', 'analytics:read', 'audit:read', 'settings:manage',
  ],
  SALES_MANAGER: [
    'leads:read', 'leads:create', 'leads:update', 'leads:delete', 'leads:export', 'leads:import', 'leads:assign',
    'deals:read', 'deals:manage', 'contacts:manage', 'companies:manage', 'tasks:manage',
    'automations:manage', 'analytics:read',
  ],
  SALES_REP: [
    'leads:read', 'leads:create', 'leads:update',
    'deals:read', 'deals:manage', 'contacts:manage', 'companies:manage', 'tasks:manage',
    'analytics:read',
  ],
  MARKETING: [
    'leads:read', 'leads:create', 'leads:update', 'leads:export', 'leads:import',
    'deals:read', 'contacts:manage', 'companies:manage', 'tasks:manage',
    'automations:manage', 'analytics:read',
  ],
  SUPPORT: [
    'leads:read', 'contacts:manage', 'companies:manage', 'tasks:manage',
  ],
  READ_ONLY: [
    'leads:read', 'deals:read', 'analytics:read',
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[role as RoleType];
  if (!allowed) return false;
  return allowed.includes(permission);
}
