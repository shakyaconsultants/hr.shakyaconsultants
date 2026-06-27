/** Central query-key registry for targeted cache invalidation after mutations. */
export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
    sessions: ['auth', 'sessions'] as const,
  },
  featureFlags: ['feature-flags'] as const,
  configuration: {
    root: ['configuration'] as const,
    navigation: ['configuration', 'navigation'] as const,
    catalog: ['configuration', 'catalog'] as const,
    sections: ['configuration', 'sections'] as const,
    settings: (params: Record<string, unknown> = {}) => ['configuration', 'settings', params] as const,
    audit: (params: Record<string, unknown> = {}) => ['configuration', 'audit', params] as const,
    systemHealth: ['configuration', 'system-health'] as const,
  },
  settings: {
    root: ['settings'] as const,
    group: (group: string) => ['settings', 'group', group] as const,
    list: (params: Record<string, unknown> = {}) => ['settings', params] as const,
  },
  organization: {
    company: ['organization', 'company'] as const,
    entity: (entityKey: string, params: Record<string, unknown> = {}) =>
      ['organization', entityKey, params] as const,
    entityDetail: (entityKey: string, id: string) => ['organization', entityKey, id] as const,
  },
  employees: {
    root: ['employees'] as const,
    list: (params: Record<string, unknown> = {}) => ['employees', 'list', params] as const,
    detail: (id: string) => ['employees', id] as const,
  },
  projects: {
    root: ['projects'] as const,
    list: (params: Record<string, unknown> = {}) => ['projects', 'list', params] as const,
    detail: (id: string) => ['projects', id] as const,
    dashboard: ['projects', 'dashboard'] as const,
  },
  recruitment: {
    root: ['recruitment'] as const,
    dashboard: ['recruitment', 'dashboard'] as const,
    candidates: (params: Record<string, unknown> = {}) => ['recruitment', 'candidates', params] as const,
  },
  leave: {
    root: ['leave'] as const,
    balances: ['leave', 'balances'] as const,
    requests: (params: Record<string, unknown> = {}) => ['leave', 'requests', params] as const,
  },
  attendance: {
    root: ['attendance'] as const,
  },
  payroll: {
    root: ['payroll'] as const,
  },
  workspace: {
    layout: ['workspace', 'layout'] as const,
    widget: (slug: string) => ['workspace', 'widget', slug] as const,
    profile: ['workspace', 'profile'] as const,
  },
  reports: {
    root: ['reports'] as const,
    dashboard: (role: string) => ['reports', 'dashboard', role] as const,
  },
  integration: {
    root: ['integration'] as const,
  },
} as const;
