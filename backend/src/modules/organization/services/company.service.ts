import { CompanyRepository } from '@domain/company/company.schema.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import type { CompanyDocument } from '@domain/company/company.schema.js';
import { MasterDataAuditService } from '@modules/organization/shared/master-data-audit.service.js';
import type { MasterDataActorContext } from '@modules/organization/shared/master-data.service.js';

function toRecord(document: CompanyDocument): Record<string, unknown> {
  return JSON.parse(JSON.stringify(document)) as Record<string, unknown>;
}

export const CompanyService = {
  async getByCompanyId(companyId: string): Promise<CompanyDocument> {
    const company = await CompanyRepository.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company not found', ERROR_CODES.NOT_FOUND);
    }
    return company;
  },

  async update(
    companyId: string,
    payload: Record<string, unknown>,
    context: MasterDataActorContext,
  ): Promise<CompanyDocument> {
    const existing = await this.getByCompanyId(companyId);
    const before = toRecord(existing);

    const updated = await CompanyRepository.update(
      companyId,
      { $set: { ...payload, updatedBy: context.userId } },
      { updatedBy: context.userId },
    );

    if (!updated) {
      throw new NotFoundError('Company not found', ERROR_CODES.NOT_FOUND);
    }

    await MasterDataAuditService.log({
      companyId,
      userId: context.userId,
      entityType: 'company',
      entityId: companyId,
      action: 'update',
      before,
      after: toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },
};
