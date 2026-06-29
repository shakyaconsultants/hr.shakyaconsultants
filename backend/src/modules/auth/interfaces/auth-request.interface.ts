import type { Request } from 'express';
import type { AuthenticatedUser } from '@modules/auth/interfaces/auth-user.interface.js';
import type { UserDocument } from '@domain/auth/user.schema.js';

export interface AuthContext {
  permissions?: string[];
  isSuperAdmin?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  authUserRecord?: UserDocument;
  auth?: AuthContext;
}

export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return 'user' in req && req.user !== undefined;
}
