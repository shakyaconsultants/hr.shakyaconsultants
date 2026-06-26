export function buildProjection(fields: string[]): Record<string, 1> {
  return fields.reduce<Record<string, 1>>((acc, field) => {
    acc[field] = 1;
    return acc;
  }, {});
}

export function buildExcludeProjection(fields: string[]): Record<string, 0> {
  return fields.reduce<Record<string, 0>>((acc, field) => {
    acc[field] = 0;
    return acc;
  }, {});
}

export function mergeProjections(
  include?: Record<string, 1>,
  exclude?: Record<string, 0>,
): Record<string, 0 | 1> {
  return { ...include, ...exclude };
}
