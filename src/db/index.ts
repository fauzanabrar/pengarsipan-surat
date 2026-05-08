import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
    console.error("❌ DATABASE_URL is missing from environment variables!");
} else {
    // Log masked connection string for debugging
    console.log("🔌 DB Connection String:", connectionString.replace(/:[^:@]*@/, ':****@'));
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const globalForDb = global as unknown as {
    client: postgres.Sql | undefined;
};

const client = globalForDb.client ?? postgres(connectionString, { 
    prepare: false,
    max: process.env.NODE_ENV === 'production' ? 20 : 5 // Limit connections in dev
});

if (process.env.NODE_ENV !== 'production') globalForDb.client = client;

export const db = drizzle(client, { schema });
