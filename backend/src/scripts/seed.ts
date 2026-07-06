import '../bootstrap-env.js';
import {
  connectMongoDB,
  disconnectMongoDB,
} from '../infrastructure/database/mongodb.connection.js';
import { registerDomainModels } from '../domain/index.js';
import { seedSystemFromEnv } from '../infrastructure/database/seed/system-init.seeder.js';

async function main(): Promise<void> {
  await connectMongoDB();
  registerDomainModels();
  await seedSystemFromEnv();
  await disconnectMongoDB();
  console.log('Seed finished.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
