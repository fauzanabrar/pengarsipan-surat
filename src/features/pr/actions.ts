'use server';

import { db } from '@/db';
import { purchaseRequests, approvalLogs } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Helper function to log approval actions
async function logApproval(prId: string, actorId: string, action: string, notes?: string) {
    await db.insert(approvalLogs).values({
        prId,
        actorId,
        action,
        notes: notes || `Action: ${action}`,
    });
}

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
    if (!session?.user) throw new Error('Unauthorized');

    const [pr] = await db.insert(purchaseRequests).values({
        requesterId: session.user.id,
        title,
        suratPengajuanUrl: fileUrl,
        keteranganPengajuan: keterangan,
        status: 'MENUNGGU_RAB',
    }).returning();

    await logApproval(pr.id, session.user.id, 'AJUKAN', 'Mengajukan permohonan baru');

    revalidatePath('/dashboard/pr');
    return pr;
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
    if (!session?.user) throw new Error('Unauthorized');

    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR not found');

    if (pr.status !== 'MENUNGGU_RAB') {
        throw new Error('PR is not in MENUNGGU_RAB state');
    }

    if (session.user.role !== 'GA_STAFF') {
        throw new Error('Only GA_STAFF can upload RAB');
    }

    await db.update(purchaseRequests)
        .set({ 
            rabUrl: fileUrl,
            keteranganRab: keterangan,
            status: 'MENUNGGU_PR',
            updatedAt: new Date(),
        })
        .where(eq(purchaseRequests.id, prId));

    await logApproval(prId, session.user.id, 'UPLOAD_RAB', 'Uploaded RAB file');

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
    if (!session?.user) throw new Error('Unauthorized');

    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR not found');

    if (pr.status !== 'MENUNGGU_PR') {
        throw new Error('PR is not in MENUNGGU_PR state');
    }

    if (session.user.role !== 'GA_STAFF') {
        throw new Error('Only GA_STAFF can upload PR');
    }

    await db.update(purchaseRequests)
        .set({ 
            prUrl: fileUrl,
            keteranganPr: keterangan,
            status: 'MENUNGGU_DIVERIFIKASI',
            updatedAt: new Date(),
        })
        .where(eq(purchaseRequests.id, prId));

    await logApproval(prId, session.user.id, 'UPLOAD_PR', 'Uploaded PR file');

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
    if (!session?.user) throw new Error('Unauthorized');

    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR not found');

    if (pr.status !== 'MENUNGGU_DIVERIFIKASI') {
        throw new Error('PR is not in MENUNGGU_DIVERIFIKASI state');
    }

    if (session.user.role !== 'GA_MANAGER') {
        throw new Error('Only GA_MANAGER can verify PR');
    }

    await db.update(purchaseRequests)
        .set({ 
            status: action,
            keteranganManager: keterangan,
            updatedAt: new Date(),
        })
        .where(eq(purchaseRequests.id, prId));

    await logApproval(prId, session.user.id, action, `Manager ${action.toLowerCase()} the request`);

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}
