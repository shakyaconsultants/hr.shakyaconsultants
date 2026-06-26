import type { Schema } from 'mongoose';
import { generateUuid } from '@shared/utils/random-id.util.js';

export function auditFieldsPlugin(schema: Schema): void {
  schema.pre('save', function setAuditFields() {
    if (this.isNew) {
      if (!this.id) {
        this.id = generateUuid();
      }
      if (!this.createdBy && this.updatedBy) {
        this.createdBy = this.updatedBy;
      }
    }
  });

  schema.pre('findOneAndUpdate', function setUpdatedTimestamp() {
    const update = this.getUpdate();
    if (update && typeof update === 'object' && !Array.isArray(update)) {
      const setUpdate = update as Record<string, unknown>;
      if (!setUpdate.$set) {
        setUpdate.$set = {};
      }
      const setObj = setUpdate.$set as Record<string, unknown>;
      setObj.updatedAt = new Date();
    }
  });
}
