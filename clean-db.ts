import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function cleanDatabase() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    console.log('Connecting to database...');
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);

    try {
        console.log('Dropping old tables and enums...');
        
        // Read and execute the SQL file
        const fs = await import('fs');
        const sql = fs.readFileSync('./drizzle/0001_reset_schema.sql', 'utf-8');
        
        await client.unsafe(sql);
        
        console.log('✅ Database cleaned successfully!');
    } catch (error) {
        console.error('❌ Error cleaning database:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

cleanDatabase();
