import type { ClientSession } from 'mongoose';
import {
  IMPORT_FORMAT,
  IMPORT_MODULE,
  ImportJobRepository,
  INTEGRATION_LOG_CATEGORY,
  JOB_STATUS,
  type ImportJobDocument,
} from '@domain/integration/integration.schemas.js';
import { CsvService } from '@modules/organization/shared/csv.service.js';
import { MasterDataService } from '@modules/organization/shared/master-data.service.js';
import { MASTER_DATA_ENTITY } from '@modules/organization/constants/organization.constants.js';
import { resolveEntityConfig } from '@modules/organization/constants/entity-registry.constants.js';
import { LeadService } from '@modules/sales/services/lead.service.js';
import { EmployeeService } from '@modules/employee/services/employee.service.js';
import { runInTransaction } from '@infrastructure/database/transaction.helper.js';
import { NotFoundError, BadRequestError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { IntegrationLogService } from '@modules/integration/services/integration-log.service.js';
import { IntegrationAuditService } from '@modules/integration/services/integration-audit.service.js';
import {
  sanitizeImportBatchError,
  sanitizeImportRowError,
} from '@shared/utils/production-sanitize.util.js';
import { IMPORT_TEMPLATES } from '@modules/integration/constants/integration.constants.js';
import type { IntegrationActorContext } from '@modules/approval/types/approval.types.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import type { MasterDataEntityKey } from '@modules/organization/constants/organization.constants.js';

export interface ImportPreviewInput {
  module: string;
  content: string;
  fileName?: string;
  entityKey?: string;
}

export type ImportExecuteInput = ImportPreviewInput;

const ORG_ENTITY_KEYS = Object.values(MASTER_DATA_ENTITY);

export const ImportPlatformService = {
  getTemplate(module: string, entityKey?: string): { headers: string[]; sampleCsv: string } {
    if (module === IMPORT_MODULE.ORGANIZATION && entityKey) {
      const config = resolveEntityConfig(entityKey);
      const headers = ['name', 'code', 'status'];
      const sampleRow = { name: `Sample ${config.label}`, code: 'CODE-001', status: 'active' };
      const header = headers.join(',');
      const row = headers.map((h) => sampleRow[h as keyof typeof sampleRow]).join(',');
      return { headers, sampleCsv: `${header}\n${row}` };
    }

    if (!(module in IMPORT_TEMPLATES)) {
      throw new NotFoundError(
        `Import template not found for module: ${module}`,
        ERROR_CODES.NOT_FOUND,
      );
    }
    const template = IMPORT_TEMPLATES[module];
    const header = template.headers.join(',');
    const row = template.headers.map((h) => template.sampleRow[h] ?? '').join(',');
    return { headers: template.headers, sampleCsv: `${header}\n${row}` };
  },

  preview(
    _context: IntegrationActorContext,
    input: ImportPreviewInput,
  ): { rows: Record<string, string>[]; totalRows: number; errors: string[] } {
    const rows = CsvService.parseCsv(input.content);
    const errors: string[] = [];

    rows.forEach((row, index) => {
      if (input.module === IMPORT_MODULE.EMPLOYEE) {
        if (!row.email || !row.firstName || !row.lastName) {
          errors.push(`Row ${String(index + 2)}: missing required employee fields`);
        }
      } else if (input.module === IMPORT_MODULE.SALES_LEAD) {
        if (!row.email && !row.firstname) {
          errors.push(`Row ${String(index + 2)}: missing email or firstname`);
        }
      } else if (input.module === IMPORT_MODULE.ORGANIZATION) {
        if (!row.name) {
          errors.push(`Row ${String(index + 2)}: missing name`);
        }
      }
    });

    return {
      rows: rows.slice(0, 10),
      totalRows: rows.length,
      errors,
    };
  },

  async execute(
    context: IntegrationActorContext,
    input: ImportExecuteInput,
  ): Promise<ImportJobDocument> {
    const preview = this.preview(context, input);
    const rows = CsvService.parseCsv(input.content);

    const job = await ImportJobRepository.create({
      id: generateUuid(),
      companyId: context.companyId,
      module: input.module,
      format: IMPORT_FORMAT.CSV,
      status: JOB_STATUS.PROCESSING,
      totalRows: rows.length,
      successCount: 0,
      errorCount: preview.errors.length,
      errors: [...preview.errors],
      previewData: preview.rows,
      fileName: input.fileName,
      createdBy: context.userId,
      updatedBy: context.userId,
    });

    try {
      const result = await runInTransaction(async (session) => {
        return this.runImport(context, input, rows, session);
      });

      const updated = await ImportJobRepository.update(
        job.id,
        {
          $set: {
            status:
              result.errorCount > 0 && result.successCount === 0
                ? JOB_STATUS.FAILED
                : JOB_STATUS.COMPLETED,
            successCount: result.successCount,
            errorCount: result.errorCount,
            errors: result.errors,
            updatedBy: context.userId,
          },
        },
        { companyId: context.companyId },
      );

      await IntegrationLogService.log({
        companyId: context.companyId,
        userId: context.userId,
        category: INTEGRATION_LOG_CATEGORY.IMPORT,
        message: `Import completed for ${input.module}`,
        metadata: {
          jobId: job.id,
          successCount: result.successCount,
          errorCount: result.errorCount,
        },
      });

      await IntegrationAuditService.log({
        companyId: context.companyId,
        userId: context.userId,
        entityType: 'import_job',
        entityId: job.id,
        action: 'import',
        after: { module: input.module, ...result },
        ip: context.ip,
        userAgent: context.userAgent,
      });

      return updated ?? job;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      await ImportJobRepository.update(
        job.id,
        {
          $set: { status: JOB_STATUS.FAILED, errors: [message], updatedBy: context.userId },
        },
        { companyId: context.companyId },
      );
      throw error;
    }
  },

  async runImport(
    context: IntegrationActorContext,
    input: ImportExecuteInput,
    rows: Record<string, string>[],
    _session?: ClientSession,
  ): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    switch (input.module) {
      case IMPORT_MODULE.ORGANIZATION: {
        if (!input.entityKey || !ORG_ENTITY_KEYS.includes(input.entityKey as MasterDataEntityKey)) {
          throw new BadRequestError('entityKey is required for organization imports');
        }
        try {
          const created = await MasterDataService.bulkCreate(
            input.entityKey as MasterDataEntityKey,
            rows,
            context,
          );
          successCount = created.length;
          await CsvService.logImport(
            input.entityKey as MasterDataEntityKey,
            created.length,
            context,
          );
        } catch {
          errors.push(sanitizeImportBatchError());
        }
        break;
      }
      case IMPORT_MODULE.EMPLOYEE: {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            if (
              !row.email ||
              !row.firstName ||
              !row.lastName ||
              !row.departmentId ||
              !row.designationId
            ) {
              errors.push(`Row ${String(i + 2)}: missing required fields`);
              continue;
            }
            await EmployeeService.create(context, {
              firstName: row.firstName,
              lastName: row.lastName,
              email: row.email,
              phone: row.phone,
              departmentId: row.departmentId,
              designationId: row.designationId,
              branchId: row.branchId,
              joinedAt: row.joinedAt ? new Date(row.joinedAt) : new Date(),
              employmentType: row.employmentType,
            });
            successCount++;
          } catch (err) {
            errors.push(
              sanitizeImportRowError(i, err instanceof Error ? err.message : 'Unknown error'),
            );
          }
        }
        break;
      }
      case IMPORT_MODULE.SALES_LEAD: {
        const result = await LeadService.importCsv(context, input.content);
        successCount = result.imported;
        errors.push(...result.errors);
        break;
      }
      default:
        throw new BadRequestError(`Import not supported for module: ${input.module}`);
    }

    return { successCount, errorCount: errors.length, errors };
  },

  async getHistory(
    companyId: string,
    query: { page?: number; pageSize?: number; module?: string },
  ): Promise<PaginatedResult<ImportJobDocument>> {
    const filter: Record<string, unknown> = {};
    if (query.module) filter.module = query.module;
    return ImportJobRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      companyId,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  },

  async getById(companyId: string, id: string): Promise<ImportJobDocument> {
    return ImportJobRepository.findByIdOrFail(id, { companyId });
  },
};
