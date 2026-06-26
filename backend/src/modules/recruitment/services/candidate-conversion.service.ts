import { UserRepository } from '@domain/auth/user.schema.js';
import { USER_STATUS } from '@domain/auth/user.schema.js';
import { RoleRepository } from '@domain/permission/permission.schemas.js';
import { OfferLetterRepository, OFFER_STATUS } from '@domain/recruitment/recruitment.schemas.js';
import { PIPELINE_STAGE } from '@domain/recruitment/recruitment-extended.schemas.js';
import { ConflictError, ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { PasswordService } from '@modules/auth/services/password.service.js';
import { EmployeeService } from '@modules/employee/services/employee.service.js';
import { EmployeeTimelineService } from '@modules/employee/services/employee-timeline.service.js';
import { RoleAssignmentService } from '@modules/rbac/services/role-assignment.service.js';
import { CandidateService } from '@modules/recruitment/services/candidate.service.js';
import { CandidatePipelineService } from '@modules/recruitment/services/candidate-pipeline.service.js';
import { OnboardingRepository } from '@domain/recruitment/recruitment.schemas.js';
import { RecruitmentTimelineService } from '@modules/recruitment/services/recruitment-timeline.service.js';
import { RecruitmentAuditService } from '@modules/recruitment/services/recruitment-audit.service.js';
import { RecruitmentActivityService } from '@modules/recruitment/services/recruitment-activity.service.js';
import { RecruitmentEmailService } from '@modules/recruitment/services/recruitment-email.service.js';
import { DEFAULT_EMPLOYEE_ROLE_SLUG } from '@modules/recruitment/constants/recruitment.constants.js';
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
      throw new ValidationError('Cannot convert rejected candidate', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }

    const acceptedOffer = await OfferLetterRepository.findOne(
      { candidateLeadId: input.candidateLeadId, status: OFFER_STATUS.ACCEPTED },
      { companyId: context.companyId },
    );
    if (!acceptedOffer) {
      throw new ValidationError('Candidate must have an accepted offer before conversion', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }

    const employeeContext = {
      companyId: context.companyId,
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
    };

    const onboarding = await OnboardingRepository.findOne({ candidateLeadId: input.candidateLeadId }, { companyId: context.companyId });
    const formData = onboarding?.formData ?? {};

    const departmentId = input.departmentId;
    const designationId = input.designationId;
    if (!departmentId) {
      throw new ValidationError('Department is required for conversion', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }
    if (!designationId) {
      throw new ValidationError('Designation is required for conversion', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }

    const employee = await EmployeeService.create(employeeContext, {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
      departmentId,
      designationId,
      branchId: input.branchId ?? candidate.branchId ?? acceptedOffer.branchId,
      jobRoleId: input.jobRoleId ?? candidate.jobRoleId ?? acceptedOffer.jobRoleId,
      reportingManagerId: input.reportingManagerId ?? candidate.reportingManagerId ?? acceptedOffer.reportingManagerId,
      joinedAt: acceptedOffer.joiningDate,
      ...(typeof formData.personal === 'object' ? formData.personal as Record<string, unknown> : {}),
    });

    const tempPassword = input.temporaryPassword ?? `Welcome@${generateUuid().slice(0, 8)}`;
    const passwordHash = await PasswordService.hashPassword(tempPassword);

    const existingUser = await UserRepository.findOne({ email: candidate.email }, { companyId: context.companyId });
    let userId: string;
    if (existingUser) {
      await UserRepository.update(
        existingUser.id,
        { employeeId: employee.id, status: USER_STATUS.INACTIVE, updatedBy: context.userId },
        { companyId: context.companyId },
      );
      userId = existingUser.id;
    } else {
      userId = generateUuid();
      await UserRepository.create(
        {
          id: userId,
          companyId: context.companyId,
          email: candidate.email,
          passwordHash,
          employeeId: employee.id,
          mustChangePassword: true,
          status: USER_STATUS.INACTIVE,
          createdBy: context.userId,
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );
    }

    const roleSlug = input.roleSlug ?? DEFAULT_EMPLOYEE_ROLE_SLUG;
    const role = await RoleRepository.findOne({ slug: roleSlug }, { companyId: context.companyId });
    if (role) {
      await RoleAssignmentService.assignRoleToEmployee(context.companyId, employee.id, role.id, {
        companyId: context.companyId,
        userId: context.userId,
        ip: context.ip,
        userAgent: context.userAgent,
      }, { isPrimary: true });
    }

    await EmployeeTimelineService.record(employeeContext, {
      employeeId: employee.id,
      eventType: EmployeeTimelineService.EVENT.JOINED,
      title: 'Converted from candidate',
      metadata: { candidateLeadId: input.candidateLeadId },
    });

    await CandidateService.update(context, input.candidateLeadId, {
      employeeId: employee.id,
      convertedAt: new Date(),
    });

    if (onboarding) {
      await OnboardingRepository.update(
        onboarding.id,
        { employeeId: employee.id, updatedBy: context.userId },
        { companyId: context.companyId },
      );
    }

    await CandidatePipelineService.transition(context, input.candidateLeadId, PIPELINE_STAGE.EMPLOYEE_CONVERTED);

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

    await RecruitmentEmailService.createWelcomeNotification(
      context,
      userId,
      'Employee Record Created',
      `Your employee profile (${employee.employeeNumber}) has been created. HR will activate your account separately.`,
      employee.id,
    );

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'conversion',
      entityId: employee.id,
      action: 'convert',
      after: { candidateLeadId: input.candidateLeadId, employeeId: employee.id, userId },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { employee, userId, accountStatus: USER_STATUS.INACTIVE };
  },
};
