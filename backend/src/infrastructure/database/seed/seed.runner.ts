import { databaseLogger } from '@logging/winston.logger.js';
import { getRegisteredSeeders } from '@infrastructure/database/seed/seed.registry.js';
import type { SeederContext, SeedRunnerResult } from '@infrastructure/database/seed/seed.types.js';

export async function runSeeders(context: SeederContext): Promise<SeedRunnerResult[]> {
  const seeders = getRegisteredSeeders();
  const results: SeedRunnerResult[] = [];

  if (seeders.length === 0) {
    databaseLogger.info('No seeders registered — skipping seed run');
    return results;
  }

  for (const seeder of seeders) {
    try {
      databaseLogger.info('Running seeder', { name: seeder.name, order: seeder.order });
      await seeder.run(context);
      results.push({ name: seeder.name, success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown seeder error';
      databaseLogger.error('Seeder failed', { name: seeder.name, error: message });
      results.push({ name: seeder.name, success: false, error: message });
    }
  }

  return results;
}
