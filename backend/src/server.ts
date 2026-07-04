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
  const { registerDomainModels, syncDomainIndexes } = await import('@domain/index.js');
  registerDomainModels();
  await syncDomainIndexes();

  initializeCloudinary();
  initializeNotificationHandlers();

  if (env.SMTP_HOST.includes('example.com') || env.SMTP_PASSWORD === 'not-configured') {
    logger.warn('SMTP is not fully configured — transactional emails will fail', {
      host: env.SMTP_HOST,
      from: env.SMTP_FROM_EMAIL,
    });
  } else {
    logger.info('SMTP configured', {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      from: env.SMTP_FROM_EMAIL,
    });
  }

  const primaryFrontendUrl = env.FRONTEND_URL.split(',')[0]?.trim() ?? '';
  if (env.NODE_ENV === 'production' && primaryFrontendUrl.includes('localhost')) {
    logger.warn('FRONTEND_URL points to localhost in production — email activation/onboarding links will be wrong', {
      frontendUrl: env.FRONTEND_URL,
    });
  } else {
    logger.info('Email link base URL', { primaryFrontendUrl });
  }

  httpServer = createServer(app);
  initializeSocket(httpServer);

  await new Promise<void>((resolve, reject) => {
    const server = httpServer;
    if (!server) {
      resolve();
      return;
    }
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${env.PORT} is already in use. Stop the other backend process (or change PORT in .env) and restart.`,
          ),
        );
        return;
      }
      reject(err);
    });
    server.listen(env.PORT, env.HOST, () => {
      logger.info(`${env.APP_NAME} started`, {
        host: env.HOST,
        port: env.PORT,
        env: env.NODE_ENV,
        apiPrefix: env.API_PREFIX,
        redis: 'connecting',
      });
      resolve();
    });
  });

  void connectRedis()
    .then((redisConnected) => {
      initializeQueues();
      if (redisConnected) {
        initializeWorkers();
      }
      logger.info('Background services ready', {
        redis: redisConnected ? 'connected' : 'disabled',
        queues: redisConnected ? 'enabled' : 'disabled',
      });
    })
    .catch((error: unknown) => {
      logger.warn('Background Redis/queue init failed — API remains available', {
        error: error instanceof Error ? error.message : String(error),
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
