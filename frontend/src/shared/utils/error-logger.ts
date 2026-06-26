export type ErrorLogContext = {
  source: string;
  route?: string;
  userId?: string;
  extra?: Record<string, unknown>;
};

export function logClientError(error: unknown, context: ErrorLogContext): void {
  const payload = {
    timestamp: new Date().toISOString(),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  };

  if (import.meta.env.DEV) {
    console.error('[ERP Error]', payload);
  }

  // Production hook point for observability (Sentry, Datadog, etc.)
}
