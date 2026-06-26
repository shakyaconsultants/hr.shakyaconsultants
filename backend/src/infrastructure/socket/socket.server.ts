import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { getEnv } from '@config/env.js';
import { createSocketCorsOptions } from '@config/cors.config.js';
import { logger } from '@logging/winston.logger.js';

let io: SocketIOServer | null = null;

/** Socket.io initialization only — no business events in Phase 0 */
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
