'use server';

import { db } from "@/db";
import { identifikasi, kodeSurat, users, settings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

async function checkAdmin() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }
    return session;
}

// Identifikasi Actions
export async function getIdentifikasiList() {
    return await db.select().from(identifikasi).orderBy(desc(identifikasi.createdAt));
}

export async function createIdentifikasi(name: string, code: string) {
    await checkAdmin();
    await db.insert(identifikasi).values({ name, code });
    revalidatePath('/dashboard/settings');
}

export async function updateIdentifikasi(id: string, name: string, code: string) {
    await checkAdmin();
    await db.update(identifikasi).set({ name, code, updatedAt: new Date() }).where(eq(identifikasi.id, id));
    revalidatePath('/dashboard/settings');
}

export async function deleteIdentifikasi(id: string) {
    await checkAdmin();
    await db.delete(identifikasi).where(eq(identifikasi.id, id));
    revalidatePath('/dashboard/settings');
}

// Kode Surat Actions
export async function getKodeSuratList() {
    return await db.select().from(kodeSurat).orderBy(desc(kodeSurat.createdAt));
}

export async function createKodeSurat(name: string, code: string) {
    await checkAdmin();
    await db.insert(kodeSurat).values({ name, code });
    revalidatePath('/dashboard/settings');
}

export async function updateKodeSurat(id: string, name: string, code: string) {
    await checkAdmin();
    await db.update(kodeSurat).set({ name, code, updatedAt: new Date() }).where(eq(kodeSurat.id, id));
    revalidatePath('/dashboard/settings');
}

export async function deleteKodeSurat(id: string) {
    await checkAdmin();
    await db.delete(kodeSurat).where(eq(kodeSurat.id, id));
    revalidatePath('/dashboard/settings');
}

// Settings Actions
export async function getSettings() {
    const [s] = await db.select().from(settings).limit(1);
    if (!s) {
        const [newSettings] = await db.insert(settings).values({}).returning();
        return newSettings;
    }
    return s;
}

export async function updateNomorSuratFormat(format: string) {
    await checkAdmin();
    const s = await getSettings();
    await db.update(settings).set({ nomorSuratFormat: format, updatedAt: new Date() }).where(eq(settings.id, s.id));
    revalidatePath('/dashboard/settings');
}

// User Actions
export async function getUsersList() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(id: string, role: 'ADMIN' | 'USER') {
    await checkAdmin();
    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
    revalidatePath('/dashboard/settings');
}
