import { OfferLetterRepository, OFFER_STATUS } from '@domain/recruitment/recruitment.schemas.js';
import { PIPELINE_STAGE } from '@domain/recruitment/recruitment-extended.schemas.js';
import { ConflictError, ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { EmployeeService } from '@modules/employee/services/employee.service.js';
import { CandidateService } from '@modules/recruitment/services/candidate.service.js';
import { CandidatePipelineService } from '@modules/recruitment/services/candidate-pipeline.service.js';
import { OnboardingRepository } from '@domain/recruitment/recruitment.schemas.js';
import { RecruitmentTimelineService } from '@modules/recruitment/services/recruitment-timeline.service.js';
import { RecruitmentAuditService } from '@modules/recruitment/services/recruitment-audit.service.js';
import { RecruitmentActivityService } from '@modules/recruitment/services/recruitment-activity.service.js';
import { EmployeeAccountService } from '@modules/employee/services/employee-account.service.js';
import type { RecruitmentActorContext } from '@modules/recruitment/types/recruitment.types.js';

export interface ConversionInput {
  candidateLeadId: string;
  branchId?: string;
  departmentId: string;
  designationId: string;
  jobRoleId?: string;
  reportingManagerId?: string;
  roleSlug?: string;
  temporaryPassword?: string;
}

export const CandidateConversionService = {
  async convert(context: RecruitmentActorContext, input: ConversionInput) {
    const candidate = await CandidateService.getById(context.companyId, input.candidateLeadId);

    if (candidate.employeeId) {
      throw new ConflictError('Candidate already converted to employee', ERROR_CODES.CONFLICT);
    }

    if (candidate.pipelineStage === PIPELINE_STAGE.REJECTED) {
      throw new ValidationError('Cannot convert rejected candidate', [], {
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    }

    const sentOffer = await OfferLetterRepository.findOne(
      { candidateLeadId: input.candidateLeadId, status: OFFER_STATUS.SENT },
      { companyId: context.companyId },
    );
    if (!sentOffer) {
      throw new ValidationError('Send the offer before converting to employee', [], {
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    }

    const candidateOnboarding = await OnboardingRepository.findOne(
      { candidateLeadId: input.candidateLeadId },
      { companyId: context.companyId },
    );
    const formData = candidateOnboarding?.formData ?? {};
    const temporaryPassword = EmployeeAccountService.resolveTemporaryPassword(
      input.temporaryPassword,
    );

    const employeeContext = {
      companyId: context.companyId,
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
    };

    const employee = await EmployeeService.create(employeeContext, {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
      departmentId: input.departmentId,
      designationId: input.designationId,
      branchId: input.branchId ?? candidate.branchId ?? sentOffer.branchId,
      reportingManagerId:
        input.reportingManagerId ?? candidate.reportingManagerId ?? sentOffer.reportingManagerId,
      joinedAt: sentOffer.joiningDate,
      temporaryPassword,
      ...(typeof formData.personal === 'object'
        ? (formData.personal as Record<string, unknown>)
        : {}),
    });

    if (candidateOnboarding) {
      await OnboardingRepository.update(
        candidateOnboarding.id,
        { employeeId: employee.id, updatedBy: context.userId },
        { companyId: context.companyId },
      );
    }

    await CandidateService.update(context, input.candidateLeadId, {
      employeeId: employee.id,
      convertedAt: new Date(),
    });

    await CandidatePipelineService.transition(
      context,
      input.candidateLeadId,
      PIPELINE_STAGE.EMPLOYEE_CONVERTED,
      undefined,
      {
        skipNotification: true,
      },
    );

    await RecruitmentTimelineService.record(context, {
      candidateLeadId: input.candidateLeadId,
      eventType: RecruitmentTimelineService.EVENT.CONVERTED,
      title: 'Converted to employee',
      metadata: { employeeId: employee.id, employeeNumber: employee.employeeNumber },
    });

    await RecruitmentActivityService.publish(context, {
      activityType: RecruitmentActivityService.TYPES.EMPLOYEE_CONVERTED,
      description: `${candidate.firstName} ${candidate.lastName} converted to employee ${employee.employeeNumber}`,
      entityType: 'employee',
      entityId: employee.id,
      metadata: { candidateLeadId: input.candidateLeadId },
    });

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'conversion',
      entityId: employee.id,
      action: 'convert',
      after: {
        candidateLeadId: input.candidateLeadId,
        employeeId: employee.id,
        userId: employee.userId,
      },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { employee, userId: employee.userId ?? '', accountStatus: 'active', temporaryPassword };
  },
};
