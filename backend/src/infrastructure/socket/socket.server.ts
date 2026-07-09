import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { getEnv } from '@config/env.js';
import { createSocketCorsOptions } from '@config/cors.config.js';
import { logger } from '@logging/winston.logger.js';
import {
  COMMUNICATION_SOCKET_EVENTS,
  CommunicationSocketService,
} from '@modules/communication/services/communication-socket.service.js';

let io: SocketIOServer | null = null;

/** Socket.io initialization — communication rooms when enabled */
export function initializeSocket(httpServer: HttpServer): SocketIOServer | null {
  const env = getEnv();

  if (!env.SOCKET_ENABLED) {
    logger.info('Socket.io disabled');
    return null;
  }

  io = new SocketIOServer(httpServer, {
    path: env.SOCKET_PATH,
    cors: createSocketCorsOptions(env),
  });

  io.on('connection', (socket) => {
    logger.debug('Socket client connected', { socketId: socket.id });

    socket.on(COMMUNICATION_SOCKET_EVENTS.JOIN_CONVERSATION, (conversationId: string) => {
      if (typeof conversationId === 'string' && conversationId.length > 0) {
        CommunicationSocketService.joinConversation(socket.id, conversationId);
      }
    });

    socket.on(COMMUNICATION_SOCKET_EVENTS.LEAVE_CONVERSATION, (conversationId: string) => {
      if (typeof conversationId === 'string' && conversationId.length > 0) {
        CommunicationSocketService.leaveConversation(socket.id, conversationId);
      }
    });

    socket.on('disconnect', () => {
      logger.debug('Socket client disconnected', { socketId: socket.id });
    });
  });

  logger.info('Socket.io initialized', { path: env.SOCKET_PATH });
  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export function closeSocket(): Promise<void> {
  if (io) {
    void io.close();
    io = null;
    logger.info('Socket.io closed');
  }
  return Promise.resolve();
}
