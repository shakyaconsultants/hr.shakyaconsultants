const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True for canonical UUID strings; rejects undefined, empty, and literal "undefined". */
export function isValidEntityId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value !== 'undefined' && UUID_PATTERN.test(value);
}

export function assertValidEntityId(value: unknown, label = 'Entity id'): asserts value is string {
  if (!isValidEntityId(value)) {
    throw new Error(`${label} is required and must be a valid UUID`);
  }
}
