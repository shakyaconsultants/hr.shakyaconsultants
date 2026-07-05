export interface StatutoryPluginConfig {
  pluginId: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export const DEFAULT_STATUTORY_PLUGINS: StatutoryPluginConfig[] = [
  {
    pluginId: 'pf',
    enabled: true,
    config: {
      name: 'Provident Fund (PF)',
      code: 'PF',
      basis: 'basic',
      employeeRate: 12,
      employerRate: 12,
    },
  },
  {
    pluginId: 'esi',
    enabled: false,
    config: {
      name: 'Employee State Insurance (ESI)',
      code: 'ESI',
      basis: 'gross',
      employeeRate: 0.75,
      employerRate: 3.25,
    },
  },
  {
    pluginId: 'professional_tax',
    enabled: true,
    config: {
      name: 'Professional Tax',
      code: 'PT',
      basis: 'gross',
      rate: 0,
      employeeRate: 200,
      employerRate: 0,
    },
  },
  {
    pluginId: 'gratuity',
    enabled: true,
    config: {
      name: 'Gratuity (Employer accrual)',
      code: 'GRAT',
      basis: 'basic',
      rate: 0,
      employeeRate: 0,
      employerRate: 4.81,
    },
  },
];

export function mergeStatutoryPlugins(
  saved: StatutoryPluginConfig[] | undefined,
): StatutoryPluginConfig[] {
  const savedMap = new Map((saved ?? []).map((plugin) => [plugin.pluginId, plugin]));
  return DEFAULT_STATUTORY_PLUGINS.map((defaults) => {
    const existing = savedMap.get(defaults.pluginId);
    if (!existing) return { ...defaults, config: { ...defaults.config } };
    return {
      ...defaults,
      enabled: existing.enabled,
      config: { ...defaults.config, ...existing.config },
    };
  });
}
