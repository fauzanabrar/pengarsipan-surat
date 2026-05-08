'use server';

import { db } from '@/db';
import { purchaseRequests, approvalLogs } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Stage 1: All users can "Ajukan Permohonan"
 * Transition: -> MENUNGGU_RAB
 */
export async function ajukanPermohonan(
    title: string,
    fileUrl: string | null, // Pre-uploaded or direct URL
    keterangan: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    return await db.transaction(async (tx) => {
        const [pr] = await tx.insert(purchaseRequests).values({
            requesterId: session.user.id!,
            title,
            suratPengajuanUrl: fileUrl,
            keteranganPengajuan: keterangan,
            status: 'MENUNGGU_RAB',
        }).returning();

        await tx.insert(approvalLogs).values({
            prId: pr.id,
            actorId: session.user.id!,
            action: 'AJUKAN',
            notes: 'Mengajukan permohonan baru',
        });

        revalidatePath('/dashboard/pr');
        return pr;
    });
}

/**
 * Stage 2: GA Staff uploads RAB
 * Transition: MENUNGGU_RAB -> MENUNGGU_PR
 */
export async function uploadRAB(
    prId: string,
    fileUrl: string | null,
    keterangan: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    if (session.user.role !== 'GA_STAFF') {
        throw new Error('Only GA_STAFF can upload RAB');
    }

    await db.transaction(async (tx) => {
        const [updatedPr] = await tx.update(purchaseRequests)
            .set({ 
                rabUrl: fileUrl,
                keteranganRab: keterangan,
                status: 'MENUNGGU_PR',
                updatedAt: new Date(),
            })
            .where(and(
                eq(purchaseRequests.id, prId),
                eq(purchaseRequests.status, 'MENUNGGU_RAB')
            ))
            .returning();

        if (!updatedPr) {
            throw new Error('PR not found or not in MENUNGGU_RAB state');
        }

        await tx.insert(approvalLogs).values({
            prId,
            actorId: session.user.id!,
            action: 'UPLOAD_RAB',
            notes: 'Uploaded RAB file',
        });
    });

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

/**
 * Stage 3: GA Staff uploads PR
 * Transition: MENUNGGU_PR -> MENUNGGU_DIVERIFIKASI
 */
export async function uploadPR(
    prId: string,
    fileUrl: string | null,
    keterangan: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    if (session.user.role !== 'GA_STAFF') {
        throw new Error('Only GA_STAFF can upload PR');
    }

    await db.transaction(async (tx) => {
        const [updatedPr] = await tx.update(purchaseRequests)
            .set({ 
                prUrl: fileUrl,
                keteranganPr: keterangan,
                status: 'MENUNGGU_DIVERIFIKASI',
                updatedAt: new Date(),
            })
            .where(and(
                eq(purchaseRequests.id, prId),
                eq(purchaseRequests.status, 'MENUNGGU_PR')
            ))
            .returning();

        if (!updatedPr) {
            throw new Error('PR not found or not in MENUNGGU_PR state');
        }

        await tx.insert(approvalLogs).values({
            prId,
            actorId: session.user.id!,
            action: 'UPLOAD_PR',
            notes: 'Uploaded PR file',
        });
    });

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

/**
 * Stage 4: GA Manager Verification
 * Transition: MENUNGGU_DIVERIFIKASI -> DITERIMA or DITOLAK
 */
export async function verifikasiManager(
    prId: string,
    action: 'DITERIMA' | 'DITOLAK',
    keterangan: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    if (session.user.role !== 'GA_MANAGER') {
        throw new Error('Only GA_MANAGER can verify PR');
    }

    await db.transaction(async (tx) => {
        const [updatedPr] = await tx.update(purchaseRequests)
            .set({ 
                status: action,
                keteranganManager: keterangan,
                updatedAt: new Date(),
            })
            .where(and(
                eq(purchaseRequests.id, prId),
                eq(purchaseRequests.status, 'MENUNGGU_DIVERIFIKASI')
            ))
            .returning();

        if (!updatedPr) {
            throw new Error('PR not found or not in MENUNGGU_DIVERIFIKASI state');
        }

        await tx.insert(approvalLogs).values({
            prId,
            actorId: session.user.id!,
            action: action,
            notes: `Manager ${action.toLowerCase()} the request`,
        });
    });

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

export async function deleteAllPRs() {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    if (session.user.role !== 'GA_MANAGER') {
        throw new Error('Only GA_MANAGER can perform this action');
    }

    await db.delete(purchaseRequests);
    
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/pr');
}
