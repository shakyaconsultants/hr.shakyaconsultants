import type { Conversation } from '@/features/communication/api/communication.api';
import type { EmployeeRecord } from '@/features/employee/api/employee.api';
import type { AuthEmployeeProfile, AuthUser } from '@/shared/stores/app.store';
import { selectLinkedEmployeeId } from '@/shared/stores/app.store';

/** All ids that represent the signed-in actor in chat (employee + user). */
export function getActorParticipantIds(
  employee: AuthEmployeeProfile | null,
  user: AuthUser | null,
): string[] {
  const ids: string[] = [];
  const employeeId = selectLinkedEmployeeId({ employee, user });
  if (employeeId) ids.push(employeeId);
  if (user?.id) ids.push(user.id);
  return [...new Set(ids)];
}

export function buildParticipantNameMap(employees: EmployeeRecord[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of employees) {
    const name = `${item.firstName} ${item.lastName}`.trim();
    map.set(item.id, name);
    if (item.userId) {
      map.set(item.userId, name);
    }
  }
  return map;
}

export function resolveParticipantName(
  participantId: string | undefined,
  nameMap: Map<string, string>,
  fallback = 'Administrator',
): string {
  if (!participantId) return fallback;
  return nameMap.get(participantId) ?? fallback;
}

export function getPeerParticipantId(
  conversation: Conversation,
  actorIds: string[],
): string | undefined {
  return conversation.participantIds.find((id) => !actorIds.includes(id));
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export function getCurrentUserDisplayName(
  employee: AuthEmployeeProfile | null,
  user: AuthUser | null,
): string {
  if (employee) {
    return `${employee.firstName} ${employee.lastName}`.trim();
  }
  if (user?.email) {
    return user.email.split('@')[0] ?? 'You';
  }
  return 'You';
}
