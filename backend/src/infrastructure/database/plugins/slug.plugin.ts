import type { Schema } from 'mongoose';
import { slugify } from '@shared/utils/slug.util.js';

export interface SlugPluginOptions {
  sourceField: string;
  slugField?: string;
}

export function slugPlugin(schema: Schema, options: SlugPluginOptions): void {
  const slugField = options.slugField ?? 'slug';
  const sourceField = options.sourceField;

  schema.pre('validate', function generateSlug() {
    const doc = this as Record<string, unknown>;
    const source = doc[sourceField];
    const existingSlug = doc[slugField];

    if (typeof source === 'string' && source.length > 0 && !existingSlug) {
      doc[slugField] = slugify(source);
    }
  });
}
