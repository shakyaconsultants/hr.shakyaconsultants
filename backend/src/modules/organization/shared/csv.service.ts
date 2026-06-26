import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { resolveEntityConfig } from '@modules/organization/constants/entity-registry.constants.js';
import type { MasterDataEntityKey } from '@modules/organization/constants/organization.constants.js';
import { MasterDataAuditService } from '@modules/organization/shared/master-data-audit.service.js';
import type { MasterDataActorContext } from '@modules/organization/shared/master-data.service.js';

const CSV_ESCAPE = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  let str: string;
  if (typeof value === 'string') {
    str = value;
  } else if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    str = String(value);
  } else {
    str = JSON.stringify(value);
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const CsvService = {
  exportToCsv(_entityKey: MasterDataEntityKey, items: BaseDocument[]): string {
    if (items.length === 0) {
      return 'id,name,code,status\n';
    }

    const keys = Object.keys(items[0]).filter(
      (key) => !['_id', '__v', 'metadata'].includes(key),
    );

    const header = keys.join(',');
    const rows = items.map((item) =>
      keys.map((key) => CSV_ESCAPE((item as unknown as Record<string, unknown>)[key])).join(','),
    );

    return [header, ...rows].join('\n');
  },

  parseCsv(content: string): Record<string, string>[] {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(',');
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() ?? '';
      });
      return row;
    });
  },

  async logExport(
    entityKey: MasterDataEntityKey,
    count: number,
    context: MasterDataActorContext,
  ): Promise<void> {
    const config = resolveEntityConfig(entityKey);
    await MasterDataAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: config.entityType,
      entityId: 'export',
      action: 'export',
      after: { count },
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },

  async logImport(
    entityKey: MasterDataEntityKey,
    count: number,
    context: MasterDataActorContext,
  ): Promise<void> {
    const config = resolveEntityConfig(entityKey);
    await MasterDataAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: config.entityType,
      entityId: 'import',
      action: 'import',
      after: { count },
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
