import type { ClientSession, QueryOptions } from 'mongoose';

/** Mongoose query options extended with domain plugin flags */
export interface DomainMongooseOptions extends QueryOptions {
  companyId?: string;
  includeDeleted?: boolean;
  updatedBy?: string;
  session?: ClientSession;
}
