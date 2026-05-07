import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import postgres from 'postgres';

async function checkConstraints() {
    const sql = postgres(process.env.DATABASE_URL!);
    
    console.log('=== Foreign key constraints on purchase_requests ===\n');
    
    const fks = await sql`
        SELECT 
            tc.constraint_name, 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'purchase_requests' 
        AND tc.constraint_type = 'FOREIGN KEY'
    `;
    
    console.table(fks);
    
    console.log('\n=== Check if user exists ===\n');
    
    const users = await sql`SELECT id, username, role FROM users`;
    console.table(users);
    
    await sql.end();
}

checkConstraints().catch(console.error);
