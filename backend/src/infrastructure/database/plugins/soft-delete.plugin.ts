import type { Schema, Query } from 'mongoose';

interface SoftDeleteDocument {
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  updatedBy: string;
  save: () => Promise<unknown>;
}

export function softDeletePlugin(schema: Schema): void {
  schema.pre(/^find/, function excludeDeleted(this: Query<unknown, unknown>) {
    if (this.getOptions().includeDeleted === true) {
      return;
    }
    this.where({ isDeleted: false });
  });

  schema.pre('countDocuments', function excludeDeleted(this: Query<unknown, unknown>) {
    if (this.getOptions().includeDeleted === true) {
      return;
    }
    this.where({ isDeleted: false });
  });

  schema.methods.softDelete = function softDelete(
    this: SoftDeleteDocument,
    deletedBy: string,
  ): Promise<unknown> {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
  };

  schema.methods.restore = function restore(
    this: SoftDeleteDocument,
    updatedBy: string,
  ): Promise<unknown> {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    this.updatedBy = updatedBy;
    return this.save();
  };
}
