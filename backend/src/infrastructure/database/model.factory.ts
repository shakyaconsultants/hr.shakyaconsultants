import mongoose, { type Model, type Schema, type SchemaDefinition, type SchemaOptions } from 'mongoose';
import { createDomainSchema } from '@infrastructure/database/base.schema.js';
import { applyBasePlugins, type ApplyPluginsOptions } from '@infrastructure/database/plugins/index.js';
import { slugPlugin } from '@infrastructure/database/plugins/slug.plugin.js';
import { searchPlugin } from '@infrastructure/database/plugins/search.plugin.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { BaseRepository } from '@infrastructure/database/base.repository.js';

export interface DefineModelOptions extends ApplyPluginsOptions {
  schemaOptions?: SchemaOptions;
  indexes?: Array<{ fields: Record<string, 1 | -1>; options?: Record<string, unknown> }>;
  searchFields?: string[];
  slug?: { sourceField: string; slugField?: string };
}

export interface DomainModelBundle<T extends BaseDocument> {
  schema: Schema;
  model: Model<T>;
  repository: BaseRepository<T>;
}

export function defineDomainModel<T extends BaseDocument>(
  modelName: string,
  collectionName: string,
  domainFields: SchemaDefinition,
  options?: DefineModelOptions,
): DomainModelBundle<T> {
  const schema = createDomainSchema(domainFields, options?.schemaOptions);
  applyBasePlugins(schema, options);

  if (options?.slug) {
    schema.plugin(slugPlugin, options.slug);
  }

  if (options?.searchFields && options.searchFields.length > 0) {
    schema.plugin(searchPlugin, { fields: options.searchFields });
  }

  options?.indexes?.forEach(({ fields, options: indexOptions }) => {
    schema.index(fields, indexOptions);
  });

  const domainModel =
    (mongoose.models[modelName] as Model<T> | undefined) ?? mongoose.model(modelName, schema, collectionName);

  return {
    schema,
    model: domainModel as Model<T>,
    repository: new BaseRepository<T>(domainModel as Model<T>),
  };
}
