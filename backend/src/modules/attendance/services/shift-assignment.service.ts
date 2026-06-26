import { ShiftAssignmentRepository } from '@domain/attendance/attendance.schemas.js';
import { WorkShiftRepository } from '@domain/organization/organization.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { AttendanceAuditService } from '@modules/attendance/services/attendance-audit.service.js';
import type { AttendanceActorContext } from '@modules/approval/types/approval.types.js';

export const ShiftAssignmentService = {
  async list(companyId: string, query: { employeeId?: string; workShiftId?: string; page?: number; pageSize?: number }) {
    const filter: Record<string, unknown> = { status: ENTITY_STATUS.ACTIVE };
    if (query.employeeId) filter.employeeId = query.employeeId;
    if (query.workShiftId) filter.workShiftId = query.workShiftId;

    return ShiftAssignmentRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'effectiveFrom',
      sortOrder: 'desc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const assignment = await ShiftAssignmentRepository.findById(id, { companyId });
    if (!assignment) {
      throw new NotFoundError('Shift assignment not found', ERROR_CODES.NOT_FOUND);
    }
    return assignment;
  },

  async create(context: AttendanceActorContext, payload: {
    employeeId: string;
    workShiftId: string;
    effectiveFrom: Date;
    effectiveTo?: Date;
  }) {
    const employee = await EmployeeRepository.findById(payload.employeeId, { companyId: context.companyId });
    if (!employee) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    const workShift = await WorkShiftRepository.findById(payload.workShiftId, { companyId: context.companyId });
    if (!workShift) {
      throw new NotFoundError('Work shift not found', ERROR_CODES.NOT_FOUND);
    }

    const overlapping = await ShiftAssignmentRepository.findOne(
      {
        employeeId: payload.employeeId,
        status: ENTITY_STATUS.ACTIVE,
        effectiveFrom: { $lte: payload.effectiveTo ?? new Date('2099-12-31') },
        $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: payload.effectiveFrom } }],
      },
      { companyId: context.companyId },
    );
    if (overlapping) {
      throw new ConflictError('Overlapping shift assignment exists', ERROR_CODES.CONFLICT);
    }

    const id = generateUuid();
    const assignment = await ShiftAssignmentRepository.create(
      {
        id,
        companyId: context.companyId,
        employeeId: payload.employeeId,
        workShiftId: payload.workShiftId,
        effectiveFrom: payload.effectiveFrom,
        effectiveTo: payload.effectiveTo,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await AttendanceAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'shift_assignment',
      entityId: id,
      action: 'create',
      after: AttendanceAuditService.toRecord(assignment),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return assignment;
  },

  async update(context: AttendanceActorContext, id: string, payload: {
    workShiftId?: string;
    effectiveFrom?: Date;
    effectiveTo?: Date;
    status?: string;
  }) {
    const before = await this.getById(context.companyId, id);

    if (payload.workShiftId) {
      const workShift = await WorkShiftRepository.findById(payload.workShiftId, { companyId: context.companyId });
      if (!workShift) {
        throw new NotFoundError('Work shift not found', ERROR_CODES.NOT_FOUND);
      }
    }

    const updated = await ShiftAssignmentRepository.update(
      id,
      { ...payload, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await AttendanceAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'shift_assignment',
      entityId: id,
      action: 'update',
      before: AttendanceAuditService.toRecord(before),
      after: AttendanceAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async remove(context: AttendanceActorContext, id: string) {
    const before = await this.getById(context.companyId, id);
    const updated = await ShiftAssignmentRepository.update(
      id,
      { status: ENTITY_STATUS.INACTIVE, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await AttendanceAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'shift_assignment',
      entityId: id,
      action: 'delete',
      before: AttendanceAuditService.toRecord(before),
      after: AttendanceAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },
};
