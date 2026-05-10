'use server';

import { db } from '@/db';
import { surat, identifikasi, kodeSurat, settings, users } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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

export async function createSurat(data: {
    type: 'MASUK' | 'KELUAR';
    tanggalSurat: Date;
    identifikasiId: string;
    kodeSuratId: string;
    perihal: string;
    tujuan?: string;
    penerima?: string;
    picUserId?: string;
    fileUrl?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    return await db.transaction(async (tx) => {
        const tahun = new Date(data.tanggalSurat).getFullYear();
        
        const [maxNomor] = await tx
            .select({ max: sql<number>`coalesce(max(${surat.nomorUrut}), 0)`.as('max') })
            .from(surat)
            .where(and(eq(surat.type, data.type), eq(sql`extract(year from ${surat.tanggalSurat})`, tahun)));
        
        const nomorUrut = (maxNomor?.max || 0) + 1;

        const [identifikasiItem] = await tx.select().from(identifikasi).where(eq(identifikasi.id, data.identifikasiId));
        const [kodeSuratItem] = await tx.select().from(kodeSurat).where(eq(kodeSurat.id, data.kodeSuratId));
        
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
            type: data.type,
            nomorSurat,
            nomorUrut,
            tanggalSurat: data.tanggalSurat,
            identifikasiId: data.identifikasiId,
            kodeSuratId: data.kodeSuratId,
            perihal: data.perihal,
            tujuan: data.tujuan,
            penerima: data.penerima,
            picUserId: data.picUserId,
            fileUrl: data.fileUrl,
        }).returning();

        const path = data.type === 'MASUK' ? '/dashboard/surat-masuk' : '/dashboard/surat-keluar';
        revalidatePath(path);

        return newSurat;
    });
}

export async function getSuratList(type: 'MASUK' | 'KELUAR') {
    return await db
        .select({
            id: surat.id,
            nomorSurat: surat.nomorSurat,
            tanggalSurat: surat.tanggalSurat,
            perihal: surat.perihal,
            penerima: surat.penerima,
            fileUrl: surat.fileUrl,
            identifikasiName: identifikasi.name,
            kodeSuratName: kodeSurat.name,
            picUserName: users.name,
        })
        .from(surat)
        .where(eq(surat.type, type))
        .leftJoin(identifikasi, eq(surat.identifikasiId, identifikasi.id))
        .leftJoin(kodeSurat, eq(surat.kodeSuratId, kodeSurat.id))
        .leftJoin(users, eq(surat.picUserId, users.id))
        .orderBy(desc(surat.tanggalSurat));
}

export async function getIdentifikasiList() {
    return await db.select().from(identifikasi).orderBy(identifikasi.name);
}

export async function getKodeSuratList() {
    return await db.select().from(kodeSurat).orderBy(kodeSurat.name);
}

export async function getUsersList() {
    return await db.select().from(users).orderBy(users.name);
}

export async function createIdentifikasi(name: string, code: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

    const [newItem] = await db.insert(identifikasi).values({ name, code }).returning();
    revalidatePath('/dashboard/identifikasi');
    return newItem;
}

export async function deleteIdentifikasi(id: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

    await db.delete(identifikasi).where(eq(identifikasi.id, id));
    revalidatePath('/dashboard/identifikasi');
}

export async function createKodeSurat(name: string, code: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

    const [newItem] = await db.insert(kodeSurat).values({ name, code }).returning();
    revalidatePath('/dashboard/kode-surat');
    return newItem;
}

export async function deleteKodeSurat(id: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

    await db.delete(kodeSurat).where(eq(kodeSurat.id, id));
    revalidatePath('/dashboard/kode-surat');
}

export async function getSettings() {
    let [settingsItem] = await db.select().from(settings);
    if (!settingsItem) {
        [settingsItem] = await db.insert(settings).values({}).returning();
    }
    return settingsItem;
}

export async function updateSettings(nomorSuratFormat: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

    const [existing] = await db.select().from(settings);
    let updated;
    if (existing) {
        [updated] = await db.update(settings).set({ nomorSuratFormat, updatedAt: new Date() }).returning();
    } else {
        [updated] = await db.insert(settings).values({ nomorSuratFormat }).returning();
    }
    revalidatePath('/dashboard/settings');
    return updated;
}

export async function deleteSurat(id: string, type: 'MASUK' | 'KELUAR') {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await db.delete(surat).where(eq(surat.id, id));
    const path = type === 'MASUK' ? '/dashboard/surat-masuk' : '/dashboard/surat-keluar';
    revalidatePath(path);
}
