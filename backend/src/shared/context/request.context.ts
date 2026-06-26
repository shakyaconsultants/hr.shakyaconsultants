import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  correlationId: string;
  requestId: string;
  userId?: string;
  tenantId?: string;
  ip?: string;
  userAgent?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function getRequestContext(): RequestContextStore | undefined {
  return requestContext.getStore();
}

export function getCorrelationId(): string | undefined {
  return requestContext.getStore()?.correlationId;
}

export function runWithRequestContext<T>(store: RequestContextStore, fn: () => T): T {
  return requestContext.run(store, fn);
}
