import { createServer, type Server as HttpServer } from 'node:http';
import { createApp } from '@app.js';
import { getEnv } from '@config/env.js';
import { connectMongoDB, disconnectMongoDB } from '@infrastructure/database/mongodb.connection.js';
import { connectRedis, disconnectRedis } from '@infrastructure/redis/redis.client.js';
import {
  initializeQueues,
  closeQueues,
} from '@infrastructure/queue/bullmq.connection.js';
import { initializeWorkers } from '@infrastructure/queue/queue.worker.js';
import { initializeCloudinary } from '@infrastructure/storage/cloudinary.service.js';
import { initializeNotificationHandlers } from '@infrastructure/notification/notification.service.js';
import {
  initializeSocket,
  closeSocket,
} from '@infrastructure/socket/socket.server.js';
import { logger } from '@logging/winston.logger.js';

let httpServer: HttpServer | null = null;

export async function startServer(): Promise<HttpServer> {
  const env = getEnv();
  const app = createApp();

  await connectMongoDB();
  const { registerDomainModels } = await import('@domain/index.js');
  registerDomainModels();

  const redisConnected = await connectRedis();
  initializeCloudinary();
  initializeNotificationHandlers();
  initializeQueues();
  if (redisConnected) {
    initializeWorkers();
  }

  httpServer = createServer(app);
  initializeSocket(httpServer);

  await new Promise<void>((resolve) => {
    const server = httpServer;
    if (!server) {
      resolve();
      return;
    }
    server.listen(env.PORT, env.HOST, () => {
      logger.info(`${env.APP_NAME} started`, {
        host: env.HOST,
        port: env.PORT,
        env: env.NODE_ENV,
        apiPrefix: env.API_PREFIX,
        redis: redisConnected ? 'connected' : 'disabled',
      });
      resolve();
    });
  });

  return httpServer;
}

export async function stopServer(): Promise<void> {
  logger.info('Graceful shutdown initiated');

  if (httpServer) {
    const server = httpServer;
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    httpServer = null;
  }

  await closeSocket();
  await closeQueues();
  await disconnectRedis();
  await disconnectMongoDB();

  logger.info('Graceful shutdown complete');
}

export function getHttpServer(): HttpServer | null {
  return httpServer;
}
