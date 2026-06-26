import { Schema, type SchemaDefinition, type SchemaOptions } from 'mongoose';

/** Reusable base fields — never duplicate in domain schemas */
export const BASE_SCHEMA_DEFINITION: SchemaDefinition = {
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  companyId: {
    type: String,
    required: true,
    index: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: String,
    required: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: String,
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  version: {
    type: Number,
    default: 0,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
};

export const BASE_SCHEMA_OPTIONS: SchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform(_doc, ret: Record<string, unknown>) {
      delete ret.__v;
      return ret;
    },
  },
  toObject: { virtuals: true },
};

export function mergeSchemaDefinition(
  domainFields: SchemaDefinition,
): SchemaDefinition {
  return { ...BASE_SCHEMA_DEFINITION, ...domainFields };
}

export function createDomainSchema(
  domainFields: SchemaDefinition,
  options?: SchemaOptions,
): Schema {
  return new Schema(mergeSchemaDefinition(domainFields), {
    ...BASE_SCHEMA_OPTIONS,
    ...options,
  });
}
