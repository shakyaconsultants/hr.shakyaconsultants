import mongoose from 'mongoose';
import { getEnv } from '@config/env.js';
import { logger } from '@logging/winston.logger.js';

let isConnected = false;

function buildMongoConnectionHint(message: string): string {
  if (!message.includes('Server selection timed out') && !message.includes('ECONNREFUSED')) {
    return message;
  }

  return [
    message,
    '',
    'MongoDB could not be reached. Common fixes on Render + Atlas:',
    '• Set MONGODB_URI in Render → Environment (full mongodb+srv://... string)',
    '• Atlas → Network Access → allow 0.0.0.0/0 (or Render outbound IPs)',
    '• URL-encode special characters in the password (@ → %40, # → %23)',
    '• Confirm MONGODB_DB_NAME matches the database name in Atlas',
  ].join('\n');
}

export async function connectMongoDB(): Promise<void> {
  if (isConnected) {
    return;
  }

  const env = getEnv();
  mongoose.set('strictQuery', true);
  // Buffer briefly in development to survive transient reconnects; fail fast in production.
  mongoose.set('bufferCommands', env.NODE_ENV === 'development');

  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
      connectTimeoutMS: env.MONGODB_CONNECT_TIMEOUT_MS,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(buildMongoConnectionHint(message), { cause: error });
  }

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
