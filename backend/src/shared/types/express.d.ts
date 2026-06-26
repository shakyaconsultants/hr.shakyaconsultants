declare global {
  namespace Express {
    interface Request {
      requestId: string;
      correlationId: string;
      user?: import('@modules/auth/interfaces/auth-user.interface.js').AuthenticatedUser;
      auth?: import('@modules/auth/interfaces/auth-request.interface.js').AuthContext;
    }
  }
}

export {};
