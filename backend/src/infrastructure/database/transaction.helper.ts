import type { ClientSession } from 'mongoose';
import { mongoose } from '@infrastructure/database/mongodb.connection.js';
import { databaseLogger } from '@logging/winston.logger.js';

const DEFAULT_MAX_ATTEMPTS = 3;

function isTransientTransactionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  if (
    message.includes('please retry') ||
    message.includes('catalog changes') ||
    message.includes('transienttransactionerror')
  ) {
    return true;
  }

  const errorLabels = (error as { errorLabels?: string[] }).errorLabels;
  return (
    Array.isArray(errorLabels) &&
    (errorLabels.includes('TransientTransactionError') ||
      errorLabels.includes('UnknownTransactionCommitResult'))
  );
}

export async function runInTransaction<T>(
  operation: (session: ClientSession) => Promise<T>,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      lastError = error;

      if (isTransientTransactionError(error) && attempt < maxAttempts) {
        const message = error instanceof Error ? error.message : 'Transaction failed';
        databaseLogger.warn('Transient transaction error — retrying', {
          attempt,
          maxAttempts,
          error: message,
        });
        continue;
      }

      const message = error instanceof Error ? error.message : 'Transaction failed';
      databaseLogger.error('Transaction aborted', { error: message });
      throw error;
    } finally {
      void session.endSession();
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Transaction failed after retries');
}

export async function withSession<T>(
  operation: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    return await operation(session);
  } finally {
    void session.endSession();
  }
}
