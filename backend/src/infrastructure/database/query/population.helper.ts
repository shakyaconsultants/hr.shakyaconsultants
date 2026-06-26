export interface PopulateConfig {
  path: string;
  select?: string;
  match?: Record<string, unknown>;
}

export function buildPopulate(paths: PopulateConfig[]): PopulateConfig[] {
  return paths.map((config) => ({
    path: config.path,
    ...(config.select ? { select: config.select } : {}),
    ...(config.match ? { match: config.match } : {}),
  }));
}

export function buildSinglePopulate(path: string, select?: string): PopulateConfig {
  return { path, ...(select ? { select } : {}) };
}
