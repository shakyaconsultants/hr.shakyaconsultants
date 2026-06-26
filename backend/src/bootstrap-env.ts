/**
 * Validates environment before any module loads the Winston logger (which also calls getEnv).
 * Failures are printed to stderr so Render/cloud logs show the real error.
 */
import dotenv from 'dotenv';
import { validateEnv } from '@config/env.schema.js';
import { primeEnv } from '@config/env.js';

dotenv.config();

try {
  primeEnv(validateEnv(process.env));
} catch (error) {
  console.error('=== HR Shakya ERP — startup failed ===');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
