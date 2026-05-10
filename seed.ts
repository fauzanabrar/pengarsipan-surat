import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { db } from './src/db';
import { users, identifikasi, kodeSurat } from './src/db/schema';
import { hash } from 'bcryptjs';

async function seed() {
    console.log('Seeding database...');

    const hashedPassword = await hash('password123', 10);

    console.log('Creating admin user...');
    const [adminUser] = await db.insert(users).values({
        username: 'admin',
        email: 'admin@kallatoyota.com',
        name: 'Administrator',
        password: hashedPassword,
        role: 'ADMIN',
    }).returning();

    const [userUser] = await db.insert(users).values({
        username: 'user',
        email: 'user@kallatoyota.com',
        name: 'User Biasa',
        password: hashedPassword,
        role: 'USER',
    }).returning();

    console.log('Creating sample identifikasi...');
    await db.insert(identifikasi).values([
        { name: 'Chief Operation Officer', code: 'COO' },
        { name: 'Staff', code: 'STAFF' },
        { name: 'Kalla Toyota', code: 'KALLA-TOYOTA' },
    ]);

    console.log('Creating sample kode surat...');
    await db.insert(kodeSurat).values([
        { name: 'Memorandum', code: 'Memo' },
        { name: 'Petunjuk Pelaksanaan', code: 'Juklak' },
        { name: 'Surat Edaran', code: 'SE' },
    ]);

    console.log('\n✅ Seeding completed successfully!');
    console.log('\nTest credentials:');
    console.log('  Username: admin | Password: password123 (ADMIN)');
    console.log('  Username: user | Password: password123 (USER)');
}

seed()
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });
