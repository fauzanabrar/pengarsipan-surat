'use server';

import { db } from '@/db';
import { purchaseRequests, approvalLogs, prItems } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and, or, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Stage 1: CABANG creates initial PR
 * Transition: -> PENDING_GAMBAR
 */
export async function createPurchaseRequest(
    title: string,
    suratCabangUrl: string | null,
    keterangan: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    return await db.transaction(async (tx) => {
        const [pr] = await tx.insert(purchaseRequests).values({
            requesterId: session.user.id!,
            title,
            suratCabangUrl,
            keteranganPengajuan: keterangan,
            status: 'PENDING_GAMBAR',
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
 * Stage 2: GA Staff uploads Gambar
 * Transition: PENDING_GAMBAR -> PENDING_RAB
 */
export async function uploadGambar(
    prId: string,
    gambarUrl: string | null,
    keterangan: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    if (session.user.role !== 'GA_STAFF') throw new Error('Only GA_STAFF can perform this action');

    await db.transaction(async (tx) => {
        const [updatedPr] = await tx.update(purchaseRequests)
            .set({ 
                gambarUrl,
                keteranganGambar: keterangan,
                status: 'PENDING_RAB',
                updatedAt: new Date(),
            })
            .where(and(
                eq(purchaseRequests.id, prId),
                or(
                    eq(purchaseRequests.status, 'PENDING_GAMBAR'),
                    eq(purchaseRequests.status, 'REVISION')
                )
            ))
            .returning();

        if (!updatedPr) throw new Error('PR not found or in invalid state');

        await tx.insert(approvalLogs).values({
            prId,
            actorId: session.user.id!,
            action: 'UPLOAD_GAMBAR',
            notes: 'Uploaded drawings/designs',
        });
    });

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

/**
 * Stage 3: GA Staff creates RAB with items
 * Transition: PENDING_RAB -> PENDING_GA_MANAGER
 */
export async function createRAB(
    prId: string,
    rabUrl: string | null,
    keterangan: string,
    items?: { name: string; quantity: number; price: string }[]
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    if (session.user.role !== 'GA_STAFF') throw new Error('Only GA_STAFF can perform this action');

    await db.transaction(async (tx) => {
        const [updatedPr] = await tx.update(purchaseRequests)
            .set({ 
                rabUrl,
                keteranganRab: keterangan,
                status: 'PENDING_GA_MANAGER',
                updatedAt: new Date(),
            })
            .where(and(
                eq(purchaseRequests.id, prId),
                or(
                    eq(purchaseRequests.status, 'PENDING_RAB'),
                    eq(purchaseRequests.status, 'REVISION')
                )
            ))
            .returning();

        if (!updatedPr) throw new Error('PR not found or in invalid state');

        if (items && items.length > 0) {
            await tx.delete(prItems).where(eq(prItems.prId, prId));
            await tx.insert(prItems).values(
                items.map(item => ({
                    prId,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                }))
            );
        }

        await tx.insert(approvalLogs).values({
            prId,
            actorId: session.user.id!,
            action: 'CREATE_RAB',
            notes: 'Created RAB with items',
        });
    });

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

/**
 * Stage 4: GA Manager Approval
 * Transition: PENDING_GA_MANAGER -> PENDING_CABANG_PR
 */
export async function approveGAManager(
    prId: string,
    approvalUrl: string | null,
    keterangan: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    if (session.user.role !== 'GA_MANAGER') throw new Error('Only GA_MANAGER can perform this action');

    await db.transaction(async (tx) => {
        const [updatedPr] = await tx.update(purchaseRequests)
            .set({ 
                gaManagerApprovalUrl: approvalUrl,
                keteranganGaManager: keterangan,
                status: 'PENDING_CABANG_PR',
                updatedAt: new Date(),
            })
            .where(and(
                eq(purchaseRequests.id, prId),
                or(
                    eq(purchaseRequests.status, 'PENDING_GA_MANAGER'),
                    eq(purchaseRequests.status, 'REVISION')
                )
            ))
            .returning();

        if (!updatedPr) throw new Error('PR not found or in invalid state');

        await tx.insert(approvalLogs).values({
            prId,
            actorId: session.user.id!,
            action: 'APPROVE_GA_MANAGER',
            notes: 'GA Manager approved the budget',
        });
    });

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

/**
 * Stage 5: CABANG uploads approved PR file
 * Transition: PENDING_CABANG_PR -> PENDING_VERIFIKASI
 */
export async function submitPRCabang(
    prId: string,
    prUrl: string | null,
    keterangan: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    // Allow the original requester to submit this
    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR not found');
    if (pr.requesterId !== session.user.id) throw new Error('Only the original requester can perform this action');

    await db.transaction(async (tx) => {
        const [updatedPr] = await tx.update(purchaseRequests)
            .set({ 
                prUrl,
                keteranganPr: keterangan,
                status: 'PENDING_VERIFIKASI',
                updatedAt: new Date(),
            })
            .where(and(
                eq(purchaseRequests.id, prId),
                or(
                    eq(purchaseRequests.status, 'PENDING_CABANG_PR'),
                    eq(purchaseRequests.status, 'REVISION')
                )
            ))
            .returning();

        if (!updatedPr) throw new Error('PR not found or in invalid state');

        await tx.insert(approvalLogs).values({
            prId,
            actorId: session.user.id!,
            action: 'SUBMIT_PR',
            notes: 'Cabang uploaded approved PR document',
        });
    });

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

/**
 * Stage 6: GA Staff uploads verification files
 * Transition: PENDING_VERIFIKASI -> PENDING_PENGADAAN
 */
export async function verifikasiSpesifikasi(
    prId: string,
    verifikasiUrls: string | null, // Made optional
    keterangan: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    if (session.user.role !== 'GA_STAFF') throw new Error('Only GA_STAFF can perform this action');

    await db.transaction(async (tx) => {
        const [updatedPr] = await tx.update(purchaseRequests)
            .set({ 
                verifikasiUrls,
                keteranganVerifikasi: keterangan,
                status: 'PENDING_PENGADAAN',
                updatedAt: new Date(),
            })
            .where(and(
                eq(purchaseRequests.id, prId),
                or(
                    eq(purchaseRequests.status, 'PENDING_VERIFIKASI'),
                    eq(purchaseRequests.status, 'REVISION')
                )
            ))
            .returning();

        if (!updatedPr) throw new Error('PR not found or in invalid state');

        await tx.insert(approvalLogs).values({
            prId,
            actorId: session.user.id!,
            action: 'VERIFIKASI',
            notes: 'GA Staff verified specifications and items',
        });
    });

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

/**
 * Stage 7: GA Staff completes procurement
 * Transition: PENDING_PENGADAAN -> COMPLETED
 */
export async function selesaikanPengadaan(
    prId: string,
    keterangan: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    if (session.user.role !== 'GA_STAFF') throw new Error('Only GA_STAFF can perform this action');

    await db.transaction(async (tx) => {
        const [updatedPr] = await tx.update(purchaseRequests)
            .set({ 
                keteranganSelesai: keterangan,
                status: 'COMPLETED',
                updatedAt: new Date(),
            })
            .where(and(
                eq(purchaseRequests.id, prId),
                or(
                    eq(purchaseRequests.status, 'PENDING_PENGADAAN'),
                    eq(purchaseRequests.status, 'REVISION')
                )
            ))
            .returning();

        if (!updatedPr) throw new Error('PR not found or in invalid state');

        await tx.insert(approvalLogs).values({
            prId,
            actorId: session.user.id!,
            action: 'COMPLETE',
            notes: 'Procurement process completed',
        });
    });

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

export async function rejectPurchaseRequest(prId: string, notes: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await db.transaction(async (tx) => {
        const [updatedPr] = await tx.update(purchaseRequests)
            .set({ 
                status: 'REJECTED',
                updatedAt: new Date(),
            })
            .where(eq(purchaseRequests.id, prId))
            .returning();

        if (!updatedPr) throw new Error('PR not found');

        await tx.insert(approvalLogs).values({
            prId,
            actorId: session.user.id!,
            action: 'REJECT',
            notes: notes || 'Permohonan ditolak',
        });
    });

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

export async function requestRevision(prId: string, notes: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await db.transaction(async (tx) => {
        const [updatedPr] = await tx.update(purchaseRequests)
            .set({ 
                status: 'REVISION',
                updatedAt: new Date(),
            })
            .where(eq(purchaseRequests.id, prId))
            .returning();

        if (!updatedPr) throw new Error('PR not found');

        await tx.insert(approvalLogs).values({
            prId,
            actorId: session.user.id!,
            action: 'REVISION',
            notes: notes || 'Revisi diperlukan',
        });
    });

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

export async function deletePurchaseRequest(prId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR not found');

    // Only requester or GA_MANAGER can delete
    if (pr.requesterId !== session.user.id && session.user.role !== 'GA_MANAGER') {
        throw new Error('You do not have permission to delete this PR');
    }

    await db.delete(purchaseRequests).where(eq(purchaseRequests.id, prId));
    
    revalidatePath('/dashboard/pr');
}

export async function updatePRField(prId: string, field: string, value: string | null, notes?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await db.transaction(async (tx) => {
        const updateData: any = { 
            [field]: value,
            updatedAt: new Date()
        };

        await tx.update(purchaseRequests)
            .set(updateData)
            .where(eq(purchaseRequests.id, prId));

        await tx.insert(approvalLogs).values({
            prId,
            actorId: session.user.id!,
            action: 'UPDATE_FILE',
            notes: notes || `Updated file: ${field}`,
        });
    });

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

export async function updateLogNote(logId: string, prId: string, notes: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await db.update(approvalLogs)
        .set({ 
            notes,
        })
        .where(eq(approvalLogs.id, logId));

    revalidatePath(`/dashboard/pr/${prId}`);
}

export async function deleteAllPRs() {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    if (session.user.role !== 'GA_MANAGER') {
        throw new Error('Only GA_MANAGER can perform this action');
    }

    await db.delete(purchaseRequests);
    
    // Delete local files in public/uploads
    try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        
        const exists = await fs.access(uploadDir).then(() => true).catch(() => false);
        
        if (exists) {
            const files = await fs.readdir(uploadDir);
            for (const file of files) {
                if (file !== '.gitkeep') {
                    await fs.unlink(path.join(uploadDir, file)).catch(err => {
                        console.error(`Failed to delete file ${file}:`, err);
                    });
                }
            }
        }
    } catch (error) {
        console.error('Failed to clear local uploads directory:', error);
    }
    
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/pr');
}
