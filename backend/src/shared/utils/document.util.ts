/** Convert a Mongoose document (or plain object) to a serializable plain record. */
export function documentToRecord(document: unknown): Record<string, unknown> {
  if (document && typeof document === 'object' && 'toObject' in document) {
    const toObject = (document as { toObject?: () => Record<string, unknown> }).toObject;
    if (typeof toObject === 'function') {
      return toObject.call(document);
    }
  }

  return JSON.parse(JSON.stringify(document)) as Record<string, unknown>;
}

/** Serialize one master-data document for API responses and cache storage. */
export function serializeMasterDataRecord<T>(document: T): T {
  return documentToRecord(document) as T;
}

/** Serialize a list of master-data documents for API responses. */
export function serializeMasterDataRecords<T>(documents: T[]): T[] {
  return documents.map(serializeMasterDataRecord);
}
