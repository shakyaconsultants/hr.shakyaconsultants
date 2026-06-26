import type { Schema } from 'mongoose';

export function versioningPlugin(schema: Schema): void {
  schema.pre('save', function incrementVersion() {
    if (!this.isNew && this.isModified()) {
      const doc = this as unknown as { version: number };
      doc.version += 1;
    }
  });

  schema.pre('findOneAndUpdate', function incrementVersion() {
    const update = this.getUpdate();
    if (update && typeof update === 'object' && !Array.isArray(update)) {
      const setUpdate = update as Record<string, unknown>;
      if (!setUpdate.$inc) {
        setUpdate.$inc = {};
      }
      (setUpdate.$inc as Record<string, number>).version = 1;
    }
  });
}
