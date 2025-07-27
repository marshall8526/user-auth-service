import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';
export const REDIS_CONNECTION = 'REDIS_CONNECTION';
