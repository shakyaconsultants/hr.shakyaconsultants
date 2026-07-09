import { getSocketServer } from '@infrastructure/socket/socket.server.js';
import { logger } from '@logging/winston.logger.js';

export const COMMUNICATION_SOCKET_EVENTS = {
  MESSAGE_NEW: 'communication:message:new',
  JOIN_CONVERSATION: 'communication:join',
  LEAVE_CONVERSATION: 'communication:leave',
} as const;

function conversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}

export const CommunicationSocketService = {
  emitNewMessage(conversationId: string, message: Record<string, unknown>): void {
    const io = getSocketServer();
    if (!io) return;

    io.to(conversationRoom(conversationId)).emit(COMMUNICATION_SOCKET_EVENTS.MESSAGE_NEW, {
      conversationId,
      message,
    });
  },

  joinConversation(socketId: string, conversationId: string): void {
    const io = getSocketServer();
    if (!io) return;

    const socket = io.sockets.sockets.get(socketId);
    if (!socket) return;

    void socket.join(conversationRoom(conversationId));
    logger.debug('Socket joined conversation room', { socketId, conversationId });
  },

  leaveConversation(socketId: string, conversationId: string): void {
    const io = getSocketServer();
    if (!io) return;

    const socket = io.sockets.sockets.get(socketId);
    if (!socket) return;

    void socket.leave(conversationRoom(conversationId));
  },
};
