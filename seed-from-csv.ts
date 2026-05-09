import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { db } from './src/db';
import { users, purchaseRequests, prItems, approvalLogs } from './src/db/schema';
import { hash } from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

async function seedFromCsv() {
    console.log('🚀 Starting Seeding from CSV...');

    // Cleanup existing data to prevent duplicates with new naming convention
    console.log('🧹 Cleaning up existing PR data...');
    await db.delete(approvalLogs);
    await db.delete(prItems);
    await db.delete(purchaseRequests);

    const csvPath = path.join(process.cwd(), 'DATA ASSET - Sheet1.csv');
    if (!fs.existsSync(csvPath)) {
        console.error('❌ CSV file not found at:', csvPath);
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Skip header
    const dataLines = lines.slice(1);
    
    // Default password for all seeded users
    const hashedPassword = await hash('password123', 10);

    // Track unique users
    const userMap = new Map<string, string>(); // userName -> UserId

    // Helper for robust CSV splitting
    function splitCsv(line: string) {
        const result = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') inQuote = !inQuote;
            else if (c === ',' && !inQuote) {
                result.push(cur);
                cur = '';
            } else cur += c;
        }
        result.push(cur);
        return result;
    }

    // Helper to get random status
    const statuses: any[] = [
        'COMPLETED', 'COMPLETED', 'COMPLETED', // More completed
        'PENDING_GAMBAR', 'PENDING_RAB', 'PENDING_GA_MANAGER', 
        'PENDING_CABANG_PR', 'REJECTED', 'REVISION'
    ];

    const now = new Date('2026-05-09T17:33:51+08:00');
    const getRandomDate = (start: Date, end: Date) => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    console.log(`📊 Processing ${dataLines.length} rows...`);

    let count = 0;
    for (const line of dataLines) {
        const parts = splitCsv(line);
        if (!parts || parts.length < 20) continue;

        const clean = (val: string) => val ? val.trim() : '';

        const branchId = clean(parts[7]);
        const assetName = clean(parts[10]);
        const tanggalPerolehan = clean(parts[11]);
        const userName = clean(parts[12]);
        const qty = parseInt(clean(parts[13])) || 1;
        const spesifikasi = clean(parts[15]);
        const subSubKelas = clean(parts[4]);
        const harga = parseFloat(clean(parts[28])) || 0;

        if (!assetName || !userName) continue;

        // 1. Ensure User exists
        let userId = userMap.get(userName);
        if (!userId) {
            const username = userName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const email = `${username}@example.com`;
            
            // Try to find existing
            const existing = await db.query.users.findFirst({
                where: (users, { eq }) => eq(users.username, username)
            });

            if (existing) {
                userId = existing.id;
            } else {
                const [newUser] = await db.insert(users).values({
                    username,
                    email,
                    name: userName, // Use the REAL name here
                    password: hashedPassword,
                    role: 'CABANG',
                    location: branchId // Keep location as BranchId
                }).returning();
                userId = newUser.id;
            }
            userMap.set(userName, userId!);
        }

        // 2. Create Purchase Request
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        let createdAt: Date;
        const rand = Math.random();
        if (rand < 0.4) {
            // Tier 1: Last 3 months (Recent activity, including current month)
            const threeMonthsAgo = new Date(now);
            threeMonthsAgo.setMonth(now.getMonth() - 3);
            createdAt = getRandomDate(threeMonthsAgo, now);
        } else if (rand < 0.8) {
            // Tier 2: 3 to 12 months ago
            const threeMonthsAgo = new Date(now);
            threeMonthsAgo.setMonth(now.getMonth() - 3);
            const oneYearAgo = new Date(now);
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            createdAt = getRandomDate(oneYearAgo, threeMonthsAgo);
        } else {
            // Tier 3: 1 to 2 years ago
            const oneYearAgo = new Date(now);
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            const twoYearsAgo = new Date(now);
            twoYearsAgo.setFullYear(now.getFullYear() - 2);
            createdAt = getRandomDate(twoYearsAgo, oneYearAgo);
        }

        // For COMPLETED or REJECTED, updatedAt should be logically later
        let updatedAt = new Date(createdAt);
        if (status === 'COMPLETED' || status === 'REJECTED') {
            // Add 1-14 days of processing time
            updatedAt = new Date(createdAt.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000);
            if (updatedAt > now) updatedAt = now;
        }

        const [pr] = await db.insert(purchaseRequests).values({
            requesterId: userId!,
            title: assetName,
            status: status,
            keteranganPengajuan: spesifikasi || `Pengadaan ${assetName}`,
            createdAt: createdAt,
            updatedAt: updatedAt,
            // Dummy URLs for files to make it look "compatible"
            suratCabangUrl: `https://auyesupvtgggdnjdzipf.supabase.co/storage/v1/object/public/pr-files/dummy-surat-${count}.pdf`,
            gambarUrl: status !== 'PENDING_GAMBAR' ? `https://auyesupvtgggdnjdzipf.supabase.co/storage/v1/object/public/pr-files/dummy-img-${count}.jpg` : null,
            rabUrl: (status === 'PENDING_GA_MANAGER' || status === 'COMPLETED') ? `https://auyesupvtgggdnjdzipf.supabase.co/storage/v1/object/public/pr-files/dummy-rab-${count}.pdf` : null,
        }).returning();

        // 3. Create PR Item
        await db.insert(prItems).values({
            prId: pr.id,
            name: assetName,
            category: subSubKelas || 'Lainnya',
            quantity: qty,
            price: harga.toString()
        });

        // 4. Add initial log
        await db.insert(approvalLogs).values({
            prId: pr.id,
            actorId: userId!,
            action: 'SUBMIT',
            notes: 'Initial data import from asset list.',
            createdAt: createdAt
        });

        count++;
        if (count % 10 === 0) console.log(`✅ Processed ${count} items...`);
    }

    console.log(`\n✨ Seeding completed! Total ${count} records imported.`);
    process.exit(0);
}

seedFromCsv().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
