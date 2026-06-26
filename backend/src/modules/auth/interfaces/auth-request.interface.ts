import type { Request } from 'express';
import type { AuthenticatedUser } from '@modules/auth/interfaces/auth-user.interface.js';

export interface AuthContext {
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  auth?: AuthContext;
}

export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return 'user' in req && req.user !== undefined;
}
