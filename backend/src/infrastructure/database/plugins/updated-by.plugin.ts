import type { Schema } from 'mongoose';

export function updatedByPlugin(schema: Schema): void {
  schema.pre('findOneAndUpdate', function setUpdatedBy() {
    const updatedBy = this.getOptions().updatedBy as string | undefined;
    if (!updatedBy) {
      return;
    }

    const update = this.getUpdate();
    if (update && typeof update === 'object' && !Array.isArray(update)) {
      const setUpdate = update as Record<string, unknown>;
      if (!setUpdate.$set) {
        setUpdate.$set = {};
      }
      (setUpdate.$set as Record<string, unknown>).updatedBy = updatedBy;
    }
  });
}
