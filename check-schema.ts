import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import postgres from 'postgres';

async function checkSchema() {
    const sql = postgres(process.env.DATABASE_URL!);
    
    console.log('=== purchase_requests table schema ===\n');
    
    const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'purchase_requests' 
        ORDER BY ordinal_position
    `;
    
    console.table(columns);
    
    console.log('\n=== pr_state enum values ===\n');
    
    const enums = await sql`
        SELECT e.enumlabel AS state
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'pr_state'
        ORDER BY e.enumsortorder
    `;
    
    console.table(enums);
    
    await sql.end();
}

checkSchema().catch(console.error);
