import type { CorsOptions } from 'cors';
import type { EnvConfig } from '@config/env.schema.js';

const LOCALHOST_DEV_PORT_PATTERN = /^517\d+$/;

export function parseFrontendUrls(frontendUrl: string): string[] {
  return frontendUrl
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

export function isLocalhostDevOrigin(origin: string): boolean {
  try {
    const { hostname, port } = new URL(origin);
    return hostname === 'localhost' && LOCALHOST_DEV_PORT_PATTERN.test(port);
  } catch {
    return false;
  }
}

export function isOriginAllowed(origin: string | undefined, env: EnvConfig): boolean {
  if (!origin) {
    return true;
  }

  const allowedOrigins = parseFrontendUrls(env.FRONTEND_URL);

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (env.NODE_ENV === 'development' && isLocalhostDevOrigin(origin)) {
    return true;
  }

  return false;
}

export function createCorsOptions(env: EnvConfig): CorsOptions {
  return {
    origin(origin, callback) {
      if (isOriginAllowed(origin, env)) {
        callback(null, origin ?? true);
        return;
      }

      callback(null, false);
    },
    credentials: env.CORS_CREDENTIALS,
  };
}

export function createSocketCorsOptions(env: EnvConfig): {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => void;
  credentials: boolean;
} {
  return {
    origin(origin, callback) {
      if (isOriginAllowed(origin, env)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: env.CORS_CREDENTIALS,
  };
}
