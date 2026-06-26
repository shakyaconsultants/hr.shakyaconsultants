import './bootstrap-env.js';
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
    const message = reason instanceof Error ? reason.message : String(reason);
    logger.error('Unhandled rejection', { message });
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception', { message: error.message });
    void stopServer().finally(() => process.exit(1));
  });
}

registerShutdownHandlers();

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  console.error('=== HR Shakya ERP — startup failed ===');
  console.error(message);
  logger.error('Failed to start application', { message });
  process.exit(1);
});
