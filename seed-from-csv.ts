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

        // Map category
        let mappedCategory = 'Lainnya';
        if (subSubKelas) {
            const sskLower = subSubKelas.toLowerCase();
            if (sskLower.includes('elektronik') || sskLower.includes('komputer') || sskLower.includes('laptop') || sskLower.includes('printer') || sskLower.includes('mesin') || sskLower.includes('ac ') || sskLower.includes('kamera') || sskLower.includes('monitor') || sskLower.includes('server')) {
                mappedCategory = 'Elektronik';
            } else if (sskLower.includes('meja') || sskLower.includes('kursi') || sskLower.includes('lemari') || sskLower.includes('rak') || sskLower.includes('furniture') || sskLower.includes('mebel') || sskLower.includes('sofa') || sskLower.includes('brankas')) {
                mappedCategory = 'Furniture';
            } else if (sskLower.includes('kendaraan') || sskLower.includes('mobil') || sskLower.includes('motor')) {
                mappedCategory = 'Kendaraan';
            } else if (sskLower.includes('bangunan') || sskLower.includes('gedung') || sskLower.includes('tanah') || sskLower.includes('renovasi')) {
                mappedCategory = 'Bangunan';
            } else if (sskLower.includes('jasa') || sskLower.includes('service') || sskLower.includes('layanan') || sskLower.includes('sewa')) {
                mappedCategory = 'Jasa';
            } else if (sskLower.includes('software') || sskLower.includes('aplikasi') || sskLower.includes('lisensi')) {
                mappedCategory = 'Software';
            }
        }

        // 3. Create PR Item
        await db.insert(prItems).values({
            prId: pr.id,
            name: assetName,
            category: mappedCategory,
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

    console.log(`\n✨ Generating extra synthetic data for pie chart...`);
    
    // Synthetic data list
    const syntheticCategories = ['Elektronik', 'Furniture', 'Kendaraan', 'Bangunan', 'Jasa', 'Software', 'Lainnya'];
    const syntheticAssets = {
        'Elektronik': ['MacBook Pro M3', 'Dell XPS 15', 'Printer Epson L3110', 'AC Daikin 1 PK', 'TV Samsung 55"'],
        'Furniture': ['Meja Kerja Staff', 'Kursi Ergonomis', 'Lemari Arsip Besi', 'Sofa Ruang Tamu', 'Whiteboard'],
        'Kendaraan': ['Toyota Avanza', 'Honda Scoopy', 'Mitsubishi Triton', 'Toyota Innova Zenix'],
        'Bangunan': ['Renovasi Plafon', 'Pengecatan Dinding', 'Perbaikan Pintu', 'Pasang Kanopi'],
        'Jasa': ['Sewa Cleaning Service', 'Service AC Tahunan', 'Sewa Genset', 'Maintenance Jaringan'],
        'Software': ['Lisensi Adobe CC', 'Microsoft Office 365', 'Antivirus Kaspersky', 'Langganan Zoom Pro'],
        'Lainnya': ['Alat Tulis Kantor', 'Seragam Karyawan', 'Buku Panduan', 'Merchandise']
    };

    const userIds = Array.from(userMap.values());
    if (userIds.length > 0) {
        for (let i = 0; i < 70; i++) { // Add 70 more synthetic PRs
            const cat = syntheticCategories[Math.floor(Math.random() * syntheticCategories.length)];
            const assetsForCat = syntheticAssets[cat as keyof typeof syntheticAssets];
            const assetName = assetsForCat[Math.floor(Math.random() * assetsForCat.length)];
            
            const userId = userIds[Math.floor(Math.random() * userIds.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            const createdAt = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
            let updatedAt = new Date(createdAt);
            if (status === 'COMPLETED' || status === 'REJECTED') {
                updatedAt = new Date(createdAt.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000);
                if (updatedAt > now) updatedAt = now;
            }

            const qty = Math.floor(Math.random() * 5) + 1;
            const harga = Math.floor(Math.random() * 15000000) + 500000;

            const [pr] = await db.insert(purchaseRequests).values({
                requesterId: userId,
                title: assetName,
                status: status,
                keteranganPengajuan: `Pengadaan ${assetName} (Synthetic)`,
                createdAt: createdAt,
                updatedAt: updatedAt,
                suratCabangUrl: `https://auyesupvtgggdnjdzipf.supabase.co/storage/v1/object/public/pr-files/dummy-surat-syn-${i}.pdf`,
                gambarUrl: status !== 'PENDING_GAMBAR' ? `https://auyesupvtgggdnjdzipf.supabase.co/storage/v1/object/public/pr-files/dummy-img-syn-${i}.jpg` : null,
                rabUrl: (status === 'PENDING_GA_MANAGER' || status === 'COMPLETED') ? `https://auyesupvtgggdnjdzipf.supabase.co/storage/v1/object/public/pr-files/dummy-rab-syn-${i}.pdf` : null,
            }).returning();

            await db.insert(prItems).values({
                prId: pr.id,
                name: assetName,
                category: cat,
                quantity: qty,
                price: harga.toString()
            });

            await db.insert(approvalLogs).values({
                prId: pr.id,
                actorId: userId,
                action: 'SUBMIT',
                notes: 'Synthetic data generation',
                createdAt: createdAt
            });
            count++;
            if (count % 10 === 0) console.log(`✅ Processed ${count} items...`);
        }
    }

    console.log(`\n✨ Seeding completed! Total ${count} records imported.`);
    process.exit(0);
}

seedFromCsv().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
