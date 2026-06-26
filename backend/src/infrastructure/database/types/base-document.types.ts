import type { Types } from 'mongoose';

export interface BaseDocumentFields {
  id: string;
  companyId: string;
  createdBy: string;
  updatedBy: string;
  deletedAt: Date | null;
  deletedBy: string | null;
  isDeleted: boolean;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/** Domain document shape — does not extend Mongoose Document to keep QueryFilter types bounded */
export interface BaseDocument extends BaseDocumentFields {
  _id: Types.ObjectId;
}

export interface AuditContext {
  userId: string;
  companyId: string;
}

export interface SoftDeleteContext extends AuditContext {
  deletedAt?: Date;
}
