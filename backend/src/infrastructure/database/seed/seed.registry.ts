import type { SeederDefinition } from '@infrastructure/database/seed/seed.types.js';

const seeders = new Map<string, SeederDefinition>();

export function registerSeeder(seeder: SeederDefinition): void {
  seeders.set(seeder.name, seeder);
}

export function getRegisteredSeeders(): SeederDefinition[] {
  return Array.from(seeders.values()).sort((a, b) => a.order - b.order);
}

export function clearSeeders(): void {
  seeders.clear();
}

/** Reserved seeder names */
export const SEEDER_NAMES = {
  COMPANY: 'company',
  PERMISSIONS: 'permissions',
  ROLES: 'roles',
  SUPER_ADMIN: 'super_admin',
} as const;
