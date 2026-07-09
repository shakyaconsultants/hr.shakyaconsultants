import { MessageRepository } from '@domain/communication/communication.schemas.js';
import { actorParticipantIds } from '@modules/communication/utils/participant.util.js';
import { batchResolveDisplayNames } from '@modules/communication/services/message-display.service.js';
import type { CommunicationActorContext } from '@modules/approval/types/approval.types.js';

type ConversationRecord = Record<string, unknown>;

async function fetchLastMessagePreviews(
  companyId: string,
  conversationIds: string[],
): Promise<Map<string, string>> {
  const previews = new Map<string, string>();
  if (conversationIds.length === 0) {
    return previews;
  }

  const messages = await MessageRepository.findMany(
    { conversationId: { $in: conversationIds }, isDeleted: false },
    { companyId },
  );

  const sorted = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  for (const message of sorted) {
    if (!previews.has(message.conversationId)) {
      const content = message.content.trim();
      previews.set(
        message.conversationId,
        content.length > 80 ? `${content.slice(0, 80)}…` : content,
      );
    }
  }

  return previews;
}

function getPeerParticipantId(
  conversation: ConversationRecord,
  actorIds: string[],
): string | undefined {
  const participantIds = Array.isArray(conversation.participantIds)
    ? (conversation.participantIds as string[])
    : [];
  return participantIds.find((id) => !actorIds.includes(id));
}

export async function enrichDirectConversationList(
  context: CommunicationActorContext,
  items: ConversationRecord[],
): Promise<ConversationRecord[]> {
  const actorIds = actorParticipantIds(context);
  const conversationIds = items
    .map((item) => (typeof item.id === 'string' ? item.id : undefined))
    .filter((id): id is string => Boolean(id));

  const previews = await fetchLastMessagePreviews(context.companyId, conversationIds);

  const peerIds = items
    .map((conversation) => getPeerParticipantId(conversation, actorIds))
    .filter((id): id is string => Boolean(id));

  const peerNames = await batchResolveDisplayNames(context.companyId, peerIds);

  return items.map((conversation) => {
    const peerId = getPeerParticipantId(conversation, actorIds);
    const peerDisplayName = peerId ? (peerNames.get(peerId) ?? 'Unknown') : 'Direct message';

    return {
      ...conversation,
      peerDisplayName,
      peerParticipantId: peerId,
      lastMessagePreview: previews.get(conversation.id as string),
    };
  });
}
