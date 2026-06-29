import mongoose from 'mongoose';
import { getEnv } from '@config/env.js';
import { logger } from '@logging/winston.logger.js';

let isConnected = false;

export async function connectMongoDB(): Promise<void> {
  if (isConnected) {
    return;
  }

  const env = getEnv();
  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', false);

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  isConnected = true;
  logger.info('MongoDB connected', { dbName: env.MONGODB_DB_NAME });
}

export async function disconnectMongoDB(): Promise<void> {
  if (!isConnected) {
    return;
  }
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected');
}

export function getMongoConnectionState(): number {
  return mongoose.connection.readyState;
}

export function checkMongoDBHealth(): Promise<{ status: string; message?: string }> {
  const state = getMongoConnectionState();
  if (state === 1) {
    return Promise.resolve({ status: 'up' });
  }
  if (state === 2) {
    return Promise.resolve({ status: 'degraded', message: 'Connecting' });
  }
  return Promise.resolve({ status: 'down', message: `ReadyState: ${String(state)}` });
}

export { mongoose };
