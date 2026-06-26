export { HTTP_STATUS, HEADERS, COOKIES } from '@shared/constants/http.constants.js';
export { ERROR_CODES } from '@shared/constants/error-codes.js';
export { HEADERS as APP_HEADERS } from '@shared/constants/http.constants.js';

export const APP_CONSTANTS = {
  REQUEST_ID_HEADER: 'x-request-id',
  CORRELATION_ID_HEADER: 'x-correlation-id',
} as const;

export const HEALTH_STATUS = {
  UP: 'up',
  DOWN: 'down',
  DEGRADED: 'degraded',
} as const;
