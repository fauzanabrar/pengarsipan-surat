'use server';

import { db } from '@/db';
import { surat, identifikasi, kodeSurat, settings, users } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and, desc, sql, count, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { uploadFile } from '@/lib/file-upload';

function generateNomorSurat(
    nomorUrut: number,
    kodeSuratCode: string,
    identifikasiCode: string,
    tahun: number,
    format: string = '{nomor}/{kode}/{identifikasi}/{tahun}'
) {
    return format
        .replace('{nomor}', nomorUrut.toString())
        .replace('{kode}', kodeSuratCode)
        .replace('{identifikasi}', identifikasiCode)
        .replace('{tahun}', tahun.toString());
}

export async function createSurat(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const type = formData.get('type') as 'MASUK' | 'KELUAR';
    const tanggalSurat = new Date(formData.get('tanggalSurat') as string);
    const identifikasiId = formData.get('identifikasiId') as string;
    const kodeSuratId = formData.get('kodeSuratId') as string;
    const perihal = formData.get('perihal') as string;
    const tujuan = formData.get('tujuan') as string | undefined;
    const penerima = formData.get('penerima') as string | undefined;
    const picUserId = formData.get('picUserId') as string | undefined;
    const fileUrlInput = formData.get('fileUrl') as string | undefined;

    let fileUrl: string | undefined;
    const file = formData.get('file') as File | null;
    if (file && file.size > 0) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        fileUrl = await uploadFile(uploadFormData);
    } else if (fileUrlInput) {
        fileUrl = fileUrlInput;
    }

    return await db.transaction(async (tx) => {
        const tahun = new Date(tanggalSurat).getFullYear();
        
        const [maxNomor] = await tx
            .select({ max: sql<number>`coalesce(max(${surat.nomorUrut}), 0)`.as('max') })
            .from(surat)
            .where(and(eq(surat.type, type), eq(sql`extract(year from ${surat.tanggalSurat})`, tahun)));
        
        const nomorUrut = (maxNomor?.max || 0) + 1;

        const [identifikasiItem] = await tx.select().from(identifikasi).where(eq(identifikasi.id, identifikasiId));
        const [kodeSuratItem] = await tx.select().from(kodeSurat).where(eq(kodeSurat.id, kodeSuratId));
        
        if (!identifikasiItem || !kodeSuratItem) throw new Error('Identifikasi or Kode Surat not found');

        let [settingsItem] = await tx.select().from(settings);
        if (!settingsItem) {
            [settingsItem] = await tx.insert(settings).values({}).returning();
        }

        const nomorSurat = generateNomorSurat(
            nomorUrut,
            kodeSuratItem.code,
            identifikasiItem.code,
            tahun,
            settingsItem.nomorSuratFormat
        );

        const [newSurat] = await tx.insert(surat).values({
            type,
            nomorSurat,
            nomorUrut,
            tanggalSurat,
            identifikasiId,
            kodeSuratId,
            perihal,
            tujuan,
            penerima,
            picUserId,
            fileUrl,
        }).returning();

        const path = type === 'MASUK' ? '/dashboard/surat-masuk' : '/dashboard/surat-keluar';
        revalidatePath(path);

        return newSurat;
    });
}

export async function getSuratList(
    type: 'MASUK' | 'KELUAR',
    options?: {
        q?: string;
        page?: number;
        pageSize?: number;
        sort?: string;
        order?: 'asc' | 'desc';
    }
) {
    const { q, page = 1, pageSize = 10, sort = 'tanggalSurat', order = 'desc' } = options || {};

    const whereFilters = [eq(surat.type, type)];
    
    if (q) {
        whereFilters.push(
            sql`(${surat.nomorSurat} ilike ${`%${q}%`} 
            or ${surat.perihal} ilike ${`%${q}%`} 
            or ${surat.penerima} ilike ${`%${q}%`}
            or ${surat.tujuan} ilike ${`%${q}%`}
            or ${identifikasi.name} ilike ${`%${q}%`}
            or ${kodeSurat.name} ilike ${`%${q}%`}
            or ${kodeSurat.code} ilike ${`%${q}%`}
            or ${users.name} ilike ${`%${q}%`})`
        );
    }

    const sortFieldMap: Record<string, any> = {
        nomorSurat: surat.nomorSurat,
        tanggalSurat: surat.tanggalSurat,
        perihal: surat.perihal,
        identifikasiName: identifikasi.name,
        kodeSuratName: kodeSurat.name,
        kodeSuratCode: kodeSurat.code,
        picUserName: users.name,
        tujuan: surat.tujuan,
    };

    const sortField = sortFieldMap[sort] || surat.tanggalSurat;
    const orderFn = order === 'asc' ? asc : desc;

    const [countResult, data] = await Promise.all([
        db.select({ total: count() })
            .from(surat)
            .leftJoin(identifikasi, eq(surat.identifikasiId, identifikasi.id))
            .leftJoin(kodeSurat, eq(surat.kodeSuratId, kodeSurat.id))
            .leftJoin(users, eq(surat.picUserId, users.id))
            .where(and(...whereFilters)),
        
        db.select({
            id: surat.id,
            nomorSurat: surat.nomorSurat,
            tanggalSurat: surat.tanggalSurat,
            perihal: surat.perihal,
            tujuan: surat.tujuan,
            penerima: surat.penerima,
            fileUrl: surat.fileUrl,
            identifikasiId: surat.identifikasiId,
            kodeSuratId: surat.kodeSuratId,
            picUserId: surat.picUserId,
            identifikasiName: identifikasi.name,
            kodeSuratName: kodeSurat.name,
            kodeSuratCode: kodeSurat.code,
            picUserName: users.name,
        })
        .from(surat)
        .leftJoin(identifikasi, eq(surat.identifikasiId, identifikasi.id))
        .leftJoin(kodeSurat, eq(surat.kodeSuratId, kodeSurat.id))
        .leftJoin(users, eq(surat.picUserId, users.id))
        .where(and(...whereFilters))
        .orderBy(orderFn(sortField))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    return {
        data,
        total: countResult[0].total,
    };
}

// Helper to get lists for dropdowns
export async function getIdentifikasiList() {
    return await db.select().from(identifikasi).orderBy(asc(identifikasi.name));
}

export async function getKodeSuratList() {
    return await db.select().from(kodeSurat).orderBy(asc(kodeSurat.name));
}

export async function getUsersList() {
    return await db.select().from(users).orderBy(asc(users.name));
}

export async function deleteSurat(id: string, type: 'MASUK' | 'KELUAR') {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await db.delete(surat).where(eq(surat.id, id));
    const path = type === 'MASUK' ? '/dashboard/surat-masuk' : '/dashboard/surat-keluar';
    revalidatePath(path);
}

export async function updateSurat(id: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const type = formData.get('type') as 'MASUK' | 'KELUAR';
    const tanggalSurat = new Date(formData.get('tanggalSurat') as string);
    const identifikasiId = formData.get('identifikasiId') as string;
    const kodeSuratId = formData.get('kodeSuratId') as string;
    const perihal = formData.get('perihal') as string;
    const tujuan = formData.get('tujuan') as string | null;
    const penerima = formData.get('penerima') as string | null;
    const picUserId = formData.get('picUserId') as string | null;
    const fileUrl = formData.get('fileUrl') as string | null;

    await db.update(surat).set({
        tanggalSurat,
        identifikasiId,
        kodeSuratId,
        perihal,
        tujuan,
        penerima,
        picUserId: picUserId || null,
        fileUrl,
        updatedAt: new Date(),
    }).where(eq(surat.id, id));

    const path = type === 'MASUK' ? '/dashboard/surat-masuk' : '/dashboard/surat-keluar';
    revalidatePath(path);
}
