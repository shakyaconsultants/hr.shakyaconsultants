/** Convert a Mongoose document (or plain object) to a JSON-safe plain record. */
export function toPlainDocument<T>(value: T): T {
  const maybeDoc = value as T & {
    toJSON?: () => T;
    toObject?: () => T;
  };
  if (typeof maybeDoc.toJSON === 'function') {
    return maybeDoc.toJSON();
  }
  if (typeof maybeDoc.toObject === 'function') {
    return maybeDoc.toObject();
  }
  return value;
}
