import type { Schema, Query } from 'mongoose';

function applyCompanyScope(this: Query<unknown, unknown>): void {
  const companyId = this.getOptions().companyId as string | undefined;
  if (companyId) {
    this.where({ companyId });
  }
}

const SCOPED_WRITE_OPS = [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
  'deleteOne',
  'deleteMany',
] as const;

export function companyScopePlugin(schema: Schema): void {
  schema.pre(/^find/, applyCompanyScope);
  schema.pre('countDocuments', applyCompanyScope);

  for (const op of SCOPED_WRITE_OPS) {
    schema.pre(op, applyCompanyScope);
  }
}
