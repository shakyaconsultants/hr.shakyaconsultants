import type { Schema } from 'mongoose';
import { softDeletePlugin } from '@infrastructure/database/plugins/soft-delete.plugin.js';
import { auditFieldsPlugin } from '@infrastructure/database/plugins/audit-fields.plugin.js';
import { companyScopePlugin } from '@infrastructure/database/plugins/company-scope.plugin.js';
import { versioningPlugin } from '@infrastructure/database/plugins/versioning.plugin.js';
import { updatedByPlugin } from '@infrastructure/database/plugins/updated-by.plugin.js';
import { paginationPlugin } from '@infrastructure/database/plugins/pagination.plugin.js';

export interface ApplyPluginsOptions {
  withSoftDelete?: boolean;
  withCompanyScope?: boolean;
  withVersioning?: boolean;
  withPagination?: boolean;
}

export function applyBasePlugins(
  schema: Schema,
  options: ApplyPluginsOptions = {},
): Schema {
  const {
    withSoftDelete = true,
    withCompanyScope = true,
    withVersioning = true,
    withPagination = true,
  } = options;

  schema.plugin(auditFieldsPlugin);
  schema.plugin(updatedByPlugin);

  if (withSoftDelete) {
    schema.plugin(softDeletePlugin);
  }
  if (withCompanyScope) {
    schema.plugin(companyScopePlugin);
  }
  if (withVersioning) {
    schema.plugin(versioningPlugin);
  }
  if (withPagination) {
    schema.plugin(paginationPlugin);
  }

  return schema;
}

export { softDeletePlugin, auditFieldsPlugin, companyScopePlugin, versioningPlugin, updatedByPlugin };
export { slugPlugin } from '@infrastructure/database/plugins/slug.plugin.js';
export { paginationPlugin } from '@infrastructure/database/plugins/pagination.plugin.js';
export { searchPlugin } from '@infrastructure/database/plugins/search.plugin.js';
