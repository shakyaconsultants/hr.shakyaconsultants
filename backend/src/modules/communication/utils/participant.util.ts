import { BROADCAST_PERMISSIONS } from '@modules/communication/constants/communication-permissions.constants.js';
import type { CommunicationActorContext } from '@modules/approval/types/approval.types.js';

/** All IDs that represent the same actor in a conversation (employee + user). */
export function actorParticipantIds(context: CommunicationActorContext): string[] {
  const ids: string[] = [];
  if (context.employeeId) ids.push(context.employeeId);
  if (context.userId) ids.push(context.userId);
  return [...new Set(ids)];
}

/** Preferred sender/participant id — always employee id when linked. */
export function primaryActorParticipantId(context: CommunicationActorContext): string | undefined {
  if (context.employeeId) {
    return context.employeeId;
  }

  const permissions = context.permissions ?? [];
  const canUseUserId =
    context.isSuperAdmin === true || permissions.includes(BROADCAST_PERMISSIONS.BROADCAST);

  return canUseUserId ? context.userId : undefined;
}

export function isConversationParticipant(
  context: CommunicationActorContext,
  participantIds: string[],
): boolean {
  if (context.isSuperAdmin) {
    return true;
  }

  const permissions = context.permissions ?? [];
  if (
    permissions.includes(BROADCAST_PERMISSIONS.BROADCAST) ||
    permissions.includes('employee.read')
  ) {
    return true;
  }

  const actorIds = actorParticipantIds(context);
  return actorIds.some((id) => participantIds.includes(id));
}

export function canSendInConversation(
  context: CommunicationActorContext,
  participantIds: string[],
): boolean {
  if (context.isSuperAdmin) {
    return true;
  }

  const actorIds = actorParticipantIds(context);
  return actorIds.some((id) => participantIds.includes(id));
}

/** Replace legacy userId with employeeId in participant lists when both refer to the same actor. */
export function normalizeParticipantIds(
  participantIds: string[],
  context: CommunicationActorContext,
): string[] {
  if (!context.employeeId || !context.userId) {
    return participantIds;
  }

  const employeeId = context.employeeId;
  const userId = context.userId;
  return participantIds.map((id) => (id === userId ? employeeId : id));
}
