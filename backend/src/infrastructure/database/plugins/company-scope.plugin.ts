import type { Schema, Query } from 'mongoose';

export function companyScopePlugin(schema: Schema): void {
  schema.pre(/^find/, function applyCompanyScope(this: Query<unknown, unknown>) {
    const companyId = this.getOptions().companyId as string | undefined;
    if (companyId) {
      this.where({ companyId });
    }
  });

  schema.pre('countDocuments', function applyCompanyScope(this: Query<unknown, unknown>) {
    const companyId = this.getOptions().companyId as string | undefined;
    if (companyId) {
      this.where({ companyId });
    }
  });
}
