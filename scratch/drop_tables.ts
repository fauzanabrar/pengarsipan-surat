import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function resetDb() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('No DB URL');
    
    console.log('Connecting to reset DB...');
    const sql = postgres(dbUrl);
    
    try {
        await sql`DROP TABLE IF EXISTS approval_logs CASCADE`;
        await sql`DROP TABLE IF EXISTS pr_items CASCADE`;
        await sql`DROP TABLE IF EXISTS purchase_requests CASCADE`;
        await sql`DROP TYPE IF EXISTS pr_state CASCADE`;
        console.log('Dropped tables and enums.');
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

resetDb();
