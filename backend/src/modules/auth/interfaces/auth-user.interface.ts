export interface AuthenticatedUser {
  userId: string;
  companyId: string;
  sessionId: string;
  employeeId?: string;
  roleIds: string[];
  tokenVersion: number;
  email: string;
}
