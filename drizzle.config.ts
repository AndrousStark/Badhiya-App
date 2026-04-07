import type { Config } from 'drizzle-kit';

/**
 * Drizzle Kit config.
 *
 * For now, Sprint 1 uses raw CREATE TABLE IF NOT EXISTS inside `src/db/client.ts`
 * so the de-risk screens work without a migrations folder. Starting Phase 2,
 * run `npm run db:generate` to emit SQL migrations from the schema, then switch
 * `src/db/client.ts` to use `useMigrations` from drizzle-orm/expo-sqlite/migrator.
 */
export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
  verbose: true,
  strict: true,
} satisfies Config;
