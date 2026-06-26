import { startServer, stopServer } from '@server.js';
import { logger } from '@logging/winston.logger.js';

async function bootstrap(): Promise<void> {
  await startServer();
}

function registerShutdownHandlers(): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down`);
    try {
      await stopServer();
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled rejection', { reason });
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    void stopServer().finally(() => process.exit(1));
  });
}

registerShutdownHandlers();

bootstrap().catch((error: unknown) => {
  logger.error('Failed to start application', { error });
  process.exit(1);
});
