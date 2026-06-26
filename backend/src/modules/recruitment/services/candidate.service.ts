import type { CandidateLeadDocument } from '@domain/recruitment/recruitment.schemas.js';
import { CandidateLeadRepository } from '@domain/recruitment/recruitment.schemas.js';
import { ResumeMetadataRepository } from '@domain/recruitment/recruitment.schemas.js';
import { PIPELINE_STAGE } from '@domain/recruitment/recruitment-extended.schemas.js';
import { UploadService } from '@infrastructure/storage/cloudinary.service.js';
import { buildSearchFilter } from '@infrastructure/database/query/search.helper.js';
import { buildExactFilter, mergeFilters } from '@infrastructure/database/query/filtering.helper.js';
import type { DomainQueryFilter } from '@infrastructure/database/types/domain-query.types.js';
import { ConflictError, NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import { RecruitmentAuditService } from '@modules/recruitment/services/recruitment-audit.service.js';
import { RecruitmentTimelineService } from '@modules/recruitment/services/recruitment-timeline.service.js';
import { RecruitmentActivityService } from '@modules/recruitment/services/recruitment-activity.service.js';
import { CandidatePipelineService } from '@modules/recruitment/services/candidate-pipeline.service.js';
import type { CandidateListQuery, RecruitmentActorContext } from '@modules/recruitment/types/recruitment.types.js';

const SEARCH_FIELDS = ['firstName', 'lastName', 'email', 'phone'];

function buildFilter(query: CandidateListQuery): DomainQueryFilter {
  const filters: DomainQueryFilter[] = [];
  if (!query.includeArchived) {
    filters.push(buildExactFilter({ isArchived: false }));
  }
  if (query.pipelineStage) {
    filters.push(buildExactFilter({ pipelineStage: query.pipelineStage }));
  }
  if (query.jobRoleId) {
    filters.push(buildExactFilter({ jobRoleId: query.jobRoleId }));
  }
  if (query.departmentId) {
    filters.push(buildExactFilter({ departmentId: query.departmentId }));
  }
  if (query.recruiterId) {
    filters.push(buildExactFilter({ recruiterId: query.recruiterId }));
  }
  if (query.search) {
    filters.push(buildSearchFilter(query.search, SEARCH_FIELDS));
  }
  return mergeFilters(...filters);
}

export const CandidateService = {
  async list(companyId: string, query: CandidateListQuery): Promise<PaginatedResult<CandidateLeadDocument>> {
    return CandidateLeadRepository.paginate(buildFilter(query), {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
      companyId,
    });
  },

  async getById(companyId: string, id: string): Promise<CandidateLeadDocument> {
    const candidate = await CandidateLeadRepository.findById(id, { companyId });
    if (!candidate) {
      throw new NotFoundError('Candidate not found', ERROR_CODES.NOT_FOUND);
    }
    return candidate;
  },

  async assertNoDuplicate(companyId: string, email: string, phone?: string, excludeId?: string): Promise<void> {
    const byEmail = await CandidateLeadRepository.findOne(
      { email: email.toLowerCase(), isArchived: false, mergedIntoId: null },
      { companyId },
    );
    if (byEmail && byEmail.id !== excludeId && !byEmail.employeeId) {
      throw new ConflictError('Active candidate with this email already exists', ERROR_CODES.CONFLICT);
    }
    if (phone?.trim()) {
      const byPhone = await CandidateLeadRepository.findOne(
        { phone: phone.trim(), isArchived: false, mergedIntoId: null },
        { companyId },
      );
      if (byPhone && byPhone.id !== excludeId && !byPhone.employeeId) {
        throw new ConflictError('Active candidate with this phone already exists', ERROR_CODES.CONFLICT);
      }
    }
  },

  async create(context: RecruitmentActorContext, payload: Record<string, unknown>): Promise<CandidateLeadDocument> {
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
    const phone = typeof payload.phone === 'string' ? payload.phone : undefined;
    await this.assertNoDuplicate(context.companyId, email, phone);

    const id = generateUuid();
    const candidate = await CandidateLeadRepository.create(
      {
        id,
        companyId: context.companyId,
        email,
        pipelineStage: PIPELINE_STAGE.LEAD,
        isArchived: false,
        tags: [],
        ...payload,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await RecruitmentTimelineService.record(context, {
      candidateLeadId: id,
      eventType: RecruitmentTimelineService.EVENT.CREATED,
      title: 'Candidate created',
    });

    await RecruitmentActivityService.publish(context, {
      activityType: RecruitmentActivityService.TYPES.CANDIDATE_CREATED,
      description: `${candidate.firstName} ${candidate.lastName} added to pipeline`,
      entityType: 'candidate',
      entityId: id,
    });

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'candidate',
      entityId: id,
      action: 'create',
      after: RecruitmentAuditService.toRecord(candidate),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return candidate;
  },

  async update(context: RecruitmentActorContext, id: string, payload: Record<string, unknown>): Promise<CandidateLeadDocument> {
    const before = await this.getById(context.companyId, id);
    if (typeof payload.email === 'string') {
      await this.assertNoDuplicate(context.companyId, payload.email, typeof payload.phone === 'string' ? payload.phone : undefined, id);
    }

    const updated = await CandidateLeadRepository.update(id, { ...payload, updatedBy: context.userId }, { companyId: context.companyId });
    if (!updated) {
      throw new NotFoundError('Candidate not found', ERROR_CODES.NOT_FOUND);
    }

    if (payload.recruiterId && payload.recruiterId !== before.recruiterId) {
      await RecruitmentActivityService.publish(context, {
        activityType: RecruitmentActivityService.TYPES.RECRUITER_ASSIGNED,
        description: `Recruiter assigned to ${updated.firstName} ${updated.lastName}`,
        entityType: 'candidate',
        entityId: id,
      });
    }

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'candidate',
      entityId: id,
      action: 'update',
      before: RecruitmentAuditService.toRecord(before),
      after: RecruitmentAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async archive(context: RecruitmentActorContext, id: string) {
    const before = await this.getById(context.companyId, id);
    const updated = await CandidateLeadRepository.update(id, { isArchived: true, updatedBy: context.userId }, { companyId: context.companyId });
    if (!updated) {
      throw new NotFoundError('Candidate not found', ERROR_CODES.NOT_FOUND);
    }
    await RecruitmentTimelineService.record(context, { candidateLeadId: id, eventType: RecruitmentTimelineService.EVENT.ARCHIVED, title: 'Candidate archived' });
    await RecruitmentAuditService.log({ companyId: context.companyId, userId: context.userId, entityType: 'candidate', entityId: id, action: 'archive', before: RecruitmentAuditService.toRecord(before), after: RecruitmentAuditService.toRecord(updated), ip: context.ip, userAgent: context.userAgent });
    return updated;
  },

  async restore(context: RecruitmentActorContext, id: string) {
    const before = await this.getById(context.companyId, id);
    const updated = await CandidateLeadRepository.update(id, { isArchived: false, updatedBy: context.userId }, { companyId: context.companyId });
    if (!updated) {
      throw new NotFoundError('Candidate not found', ERROR_CODES.NOT_FOUND);
    }
    await RecruitmentTimelineService.record(context, { candidateLeadId: id, eventType: RecruitmentTimelineService.EVENT.RESTORED, title: 'Candidate restored' });
    await RecruitmentAuditService.log({ companyId: context.companyId, userId: context.userId, entityType: 'candidate', entityId: id, action: 'restore', before: RecruitmentAuditService.toRecord(before), after: RecruitmentAuditService.toRecord(updated), ip: context.ip, userAgent: context.userAgent });
    return updated;
  },

  async merge(context: RecruitmentActorContext, primaryId: string, secondaryId: string) {
    if (primaryId === secondaryId) {
      throw new ConflictError('Cannot merge candidate with itself', ERROR_CODES.CONFLICT);
    }
    const primary = await this.getById(context.companyId, primaryId);
    const secondary = await this.getById(context.companyId, secondaryId);

    await CandidateLeadRepository.update(
      secondaryId,
      { mergedIntoId: primaryId, isArchived: true, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await RecruitmentTimelineService.record(context, {
      candidateLeadId: primaryId,
      eventType: RecruitmentTimelineService.EVENT.MERGED,
      title: `Merged with ${secondary.firstName} ${secondary.lastName}`,
      metadata: { secondaryId },
    });

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'candidate',
      entityId: primaryId,
      action: 'merge',
      after: { primaryId, secondaryId },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return primary;
  },

  async uploadResume(context: RecruitmentActorContext, candidateLeadId: string, file: { buffer: Buffer; filename: string; mimeType: string }) {
    await this.getById(context.companyId, candidateLeadId);

    const existing = await ResumeMetadataRepository.findMany({ candidateLeadId, isLatest: true }, { companyId: context.companyId });
    for (const resume of existing) {
      await ResumeMetadataRepository.update(resume.id, { isLatest: false, updatedBy: context.userId }, { companyId: context.companyId });
    }

    const nextVersion = existing.length > 0 ? Math.max(...existing.map((r) => r.version)) + 1 : 1;
    const folder = `recruitment/candidates/${candidateLeadId}/resumes`;
    const upload = await UploadService.uploadDocument({ buffer: file.buffer, folder, filename: file.filename, mimeType: file.mimeType });

    const id = generateUuid();
    const resume = await ResumeMetadataRepository.create(
      {
        id,
        companyId: context.companyId,
        candidateLeadId,
        fileName: file.filename,
        fileUrl: upload.secureUrl,
        publicId: upload.publicId,
        mimeType: file.mimeType,
        fileSize: upload.bytes,
        version: nextVersion,
        isLatest: true,
        parsedData: {},
        skills: [],
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await CandidateLeadRepository.update(
      candidateLeadId,
      { resumeUrl: upload.secureUrl, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await RecruitmentTimelineService.record(context, {
      candidateLeadId,
      eventType: RecruitmentTimelineService.EVENT.RESUME_UPLOADED,
      title: `Resume v${String(nextVersion)} uploaded`,
      metadata: { resumeId: id },
    });

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'resume',
      entityId: id,
      action: 'upload',
      after: RecruitmentAuditService.toRecord(resume),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return resume;
  },

  async listResumes(companyId: string, candidateLeadId: string) {
    return ResumeMetadataRepository.findMany({ candidateLeadId }, { companyId });
  },

  async movePipelineStage(context: RecruitmentActorContext, id: string, toStage: string, reason?: string) {
    return CandidatePipelineService.transition(context, id, toStage, reason);
  },

  exportToCsv(candidates: CandidateLeadDocument[]): string {
    const cols = ['id', 'firstName', 'lastName', 'email', 'phone', 'pipelineStage', 'jobRoleId', 'departmentId'] as const;
    const header = cols.join(',');
    const rows = candidates.map((c) =>
      cols.map((col) => csvCell(c[col])).join(','),
    );
    return [header, ...rows].join('\n');
  },
};

function csvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}
