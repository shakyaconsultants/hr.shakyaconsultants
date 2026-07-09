import type { UserDocument } from '@domain/auth/user.schema.js';
import { UserRepository } from '@domain/auth/user.schema.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { RoleRepository } from '@domain/permission/permission.schemas.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';

/** Display label for portal users (admins) — never merged into employee records. */
export async function resolvePortalUserDisplayName(
  companyId: string,
  user: UserDocument,
): Promise<string> {
  if (user.roleIds.length > 0) {
    const roles = await RoleRepository.findMany({ id: { $in: user.roleIds } }, { companyId });
    const superAdmin = roles.find((role) => role.slug === SYSTEM_ROLE_SLUG.SUPER_ADMIN);
    const primary = superAdmin ?? roles[0];
    if (primary.name) {
      return primary.name;
    }
  }

  return 'Administrator';
}

export async function resolveParticipantDisplayName(
  companyId: string,
  participantId: string,
): Promise<string> {
  const names = await batchResolveDisplayNames(companyId, [participantId]);
  return names.get(participantId) ?? 'Unknown';
}

export async function resolveSenderDisplayName(
  companyId: string,
  senderId: string,
): Promise<string> {
  return resolveParticipantDisplayName(companyId, senderId);
}

/**
 * Resolve display names for a set of participant/sender ids.
 * Employees come from the employee collection; portal admins from users + roles.
 */
export async function batchResolveDisplayNames(
  companyId: string,
  participantIds: string[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(participantIds.filter(Boolean))];
  const result = new Map<string, string>();
  if (uniqueIds.length === 0) {
    return result;
  }

  const employeesById = await EmployeeRepository.findMany(
    { id: { $in: uniqueIds } },
    { companyId },
  );
  for (const employee of employeesById) {
    result.set(employee.id, `${employee.firstName} ${employee.lastName}`.trim());
  }

  const employeesByUserId = await EmployeeRepository.findMany(
    { userId: { $in: uniqueIds } },
    { companyId },
  );
  for (const employee of employeesByUserId) {
    if (employee.userId) {
      result.set(employee.userId, `${employee.firstName} ${employee.lastName}`.trim());
    }
  }

  const unresolved = uniqueIds.filter((id) => !result.has(id));
  if (unresolved.length === 0) {
    return result;
  }

  const users = await UserRepository.findMany({ id: { $in: unresolved } }, { companyId });
  await Promise.all(
    users.map(async (user) => {
      result.set(user.id, await resolvePortalUserDisplayName(companyId, user));
    }),
  );

  for (const id of unresolved) {
    if (!result.has(id)) {
      result.set(id, 'Unknown');
    }
  }

  return result;
}

export async function enrichMessageRecord(
  companyId: string,
  record: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const senderId = typeof record.senderId === 'string' ? record.senderId : undefined;
  if (!senderId) {
    return record;
  }

  const senderName = await resolveSenderDisplayName(companyId, senderId);
  return { ...record, senderName };
}

export async function enrichMessageRecords(
  companyId: string,
  records: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const uniqueSenderIds = [
    ...new Set(records.map((r) => r.senderId).filter((id): id is string => typeof id === 'string')),
  ];
  const nameBySenderId = await batchResolveDisplayNames(companyId, uniqueSenderIds);

  return records.map((record) => {
    const senderId = typeof record.senderId === 'string' ? record.senderId : undefined;
    if (!senderId) return record;
    return { ...record, senderName: nameBySenderId.get(senderId) ?? 'Unknown' };
  });
}
