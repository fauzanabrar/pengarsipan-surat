import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import postgres from 'postgres';

async function testConnection() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is missing');
        process.exit(1);
    }

    console.log('Testing connection to:', process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    try {
        const sql = postgres(process.env.DATABASE_URL);
        const result = await sql`SELECT 1 as test`;
        console.log('✅ Connection successful!', result);
        await sql.end();
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Connection failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testConnection();
