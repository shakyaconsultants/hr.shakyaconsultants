/**
 * @deprecated Use AccessTokenPayload from @modules/auth/interfaces/jwt-payload.interface.js
 */
export type { AccessTokenPayload as JwtPayload } from '@modules/auth/interfaces/jwt-payload.interface.js';

export {
  getJwtConfig,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashRefreshToken,
  parseExpiresInToMs,
  TokenService,
} from '@modules/auth/services/token.service.js';
