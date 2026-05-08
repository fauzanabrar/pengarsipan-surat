import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { db } from './src/db';
import { users, purchaseRequests } from './src/db/schema';
import { hash } from 'bcryptjs';

async function seed() {
    console.log('Seeding database...');

    // Hash password for all test users
    const hashedPassword = await hash('password123', 10);

    // Create test users
    console.log('Creating test users...');
    
    const [cabangUser] = await db.insert(users).values({
        username: 'cabang',
        email: 'cabang@example.com',
        name: 'User Cabang',
        password: hashedPassword,
        role: 'CABANG',
    }).returning();

    const [gaStaffUser] = await db.insert(users).values({
        username: 'ga_staff',
        email: 'ga.staff@example.com',
        name: 'GA Staff',
        password: hashedPassword,
        role: 'GA_STAFF',
    }).returning();

    const [gaManagerUser] = await db.insert(users).values({
        username: 'ga_manager',
        email: 'ga.manager@example.com',
        name: 'GA Manager',
        password: hashedPassword,
        role: 'GA_MANAGER',
    }).returning();

    console.log('Created users:');
    console.log(`  - CABANG: ${cabangUser.username} (${cabangUser.id})`);
    console.log(`  - GA_STAFF: ${gaStaffUser.username} (${gaStaffUser.id})`);
    console.log(`  - GA_MANAGER: ${gaManagerUser.username} (${gaManagerUser.id})`);

    // Create a sample PR in MENUNGGU_RAB state
    console.log('\nCreating sample PR...');
    
    const [samplePR] = await db.insert(purchaseRequests).values({
        requesterId: cabangUser.id,
        title: 'Pengadaan Komputer Cabang Jakarta',
        suratPengajuanUrl: 'https://example.com/surat.pdf',
        keteranganPengajuan: 'Kebutuhan komputer baru untuk kantor cabang Jakarta',
        status: 'MENUNGGU_RAB',
    }).returning();

    console.log(`Created sample PR: ${samplePR.title} (${samplePR.id})`);

    console.log('\n✅ Seeding completed successfully!');
    console.log('\nTest credentials:');
    console.log('  Username: cabang | Password: password123');
    console.log('  Username: ga_staff | Password: password123');
    console.log('  Username: ga_manager | Password: password123');
}

seed()
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });
