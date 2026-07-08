export { INTEGRATION_PERMISSIONS } from '@modules/integration/constants/integration-permissions.constants.js';

export const INTEGRATION_ROUTES = {
  BASE: '/integration',
} as const;

export const INTEGRATION_AUDIT_WHERE = 'integration' as const;

export const INTEGRATION_SETTINGS_GROUP = 'integrations' as const;

export const INTEGRATION_SETTING_KEYS = {
  CONNECTOR_PREFIX: 'integrations.connector.',
  WEBHOOK_DEFAULT_RETRY: 'integrations.webhook.default_retry',
} as const;

export const IMPORT_TEMPLATES: Record<
  string,
  { headers: string[]; sampleRow: Record<string, string> }
> = {
  organization: {
    headers: ['name', 'code', 'status'],
    sampleRow: { name: 'Sample Department', code: 'DEPT-001', status: 'active' },
  },
  employee: {
    headers: [
      'firstName',
      'lastName',
      'email',
      'departmentId',
      'designationId',
      'branchId',
      'joinedAt',
    ],
    sampleRow: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      departmentId: '',
      designationId: '',
      branchId: '',
      joinedAt: '2026-01-01',
    },
  },
  sales_lead: {
    headers: ['firstname', 'lastname', 'email', 'phone', 'company', 'source'],
    sampleRow: {
      firstname: 'Jane',
      lastname: 'Smith',
      email: 'jane@example.com',
      phone: '+1234567890',
      company: 'Acme Corp',
      source: 'website',
    },
  },
  recruitment: {
    headers: ['firstName', 'lastName', 'email', 'phone', 'source'],
    sampleRow: {
      firstName: 'Alex',
      lastName: 'Candidate',
      email: 'alex@example.com',
      phone: '+1234567890',
      source: 'referral',
    },
  },
};
