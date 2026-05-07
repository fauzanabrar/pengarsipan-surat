'use server';

import { db } from '@/db';
import { purchaseRequests, prItems, approvalLogs } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { uploadFile, uploadFilesFromUrls } from '@/lib/file-upload';

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
 * Initialize a new Purchase Request
 * CABANG creates the initial request with Surat Cabang
 */
export async function createPurchaseRequest(
    title: string,
    description: string,
    suratCabangFile?: File
) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    let suratCabangUrl: string | undefined;

    if (suratCabangFile) {
        suratCabangUrl = await uploadFile(suratCabangFile);
    }

    const [pr] = await db.insert(purchaseRequests).values({
        requesterId: session.user.id,
        title,
        description,
        suratCabangUrl,
        totalAmount: '0',
        status: 'PENDING_GAMBAR',
    }).returning();

    await logApproval(pr.id, session.user.id, 'SUBMIT', 'Created PR - Pending Gambar');

    revalidatePath('/dashboard/pr');
    return pr;
}

/**
 * GA_STAFF uploads gambar/drawing
 * Transition: PENDING_GAMBAR -> PENDING_RAB
 */
export async function uploadGambar(prId: string, gambarFile: File) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR not found');

    if (pr.status !== 'PENDING_GAMBAR') {
        throw new Error('PR is not in PENDING_GAMBAR state');
    }

    if (session.user.role !== 'GA_STAFF') {
        throw new Error('Only GA_STAFF can upload gambar');
    }

    const gambarUrl = await uploadFile(gambarFile);

    await db.update(purchaseRequests)
        .set({ 
            gambarUrl,
            status: 'PENDING_RAB',
            updatedAt: new Date(),
        })
        .where(eq(purchaseRequests.id, prId));

    await logApproval(prId, session.user.id, 'UPLOAD_GAMBAR', 'Uploaded gambar - Pending RAB');

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

/**
 * GA_STAFF creates RAB (items and pricing)
 * Transition: PENDING_RAB -> PENDING_GA_MANAGER
 */
export async function createRAB(
    prId: string,
    items: { name: string; quantity: number; price: number }[],
    rabFile?: File
) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR not found');

    if (pr.status !== 'PENDING_RAB') {
        throw new Error('PR is not in PENDING_RAB state');
    }

    if (session.user.role !== 'GA_STAFF') {
        throw new Error('Only GA_STAFF can create RAB');
    }

    let rabUrl: string | undefined;
    if (rabFile) {
        rabUrl = await uploadFile(rabFile);
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update PR with RAB URL and total
    await db.update(purchaseRequests)
        .set({
            rabUrl,
            totalAmount: totalAmount.toString(),
            status: 'PENDING_GA_MANAGER',
            updatedAt: new Date(),
        })
        .where(eq(purchaseRequests.id, prId));

    // Insert PR items
    if (items.length > 0) {
        await db.insert(prItems).values(
            items.map(item => ({
                prId,
                name: item.name,
                quantity: item.quantity,
                price: item.price.toString(),
            }))
        );
    }

    await logApproval(prId, session.user.id, 'CREATE_RAB', `Created RAB with ${items.length} items - Pending GA Manager Approval`);

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

/**
 * GA_MANAGER approves RAB and Gambar with approval file
 * Transition: PENDING_GA_MANAGER -> PENDING_CABANG_PR
 */
export async function approveGAManager(prId: string, approvalFile: File) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR not found');

    if (pr.status !== 'PENDING_GA_MANAGER') {
        throw new Error('PR is not in PENDING_GA_MANAGER state');
    }

    if (session.user.role !== 'GA_MANAGER') {
        throw new Error('Only GA_MANAGER can approve RAB');
    }

    const gaManagerApprovalUrl = await uploadFile(approvalFile);

    await db.update(purchaseRequests)
        .set({
            gaManagerApprovalUrl,
            status: 'PENDING_CABANG_PR',
            updatedAt: new Date(),
        })
        .where(eq(purchaseRequests.id, prId));

    await logApproval(prId, session.user.id, 'APPROVE', 'GA Manager approved RAB - Pending Cabang PR');

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

/**
 * CABANG submits PR with approved PR file
 * Transition: PENDING_CABANG_PR -> PENDING_VERIFIKASI
 */
export async function submitPRCabang(prId: string, approvedPRFile: File) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR not found');

    if (pr.status !== 'PENDING_CABANG_PR') {
        throw new Error('PR is not in PENDING_CABANG_PR state');
    }

    if (session.user.role !== 'CABANG') {
        throw new Error('Only CABANG can submit PR');
    }

    const approvedPRUrl = await uploadFile(approvedPRFile);

    await db.update(purchaseRequests)
        .set({
            suratCabangUrl: approvedPRUrl, // Reuse field for approved PR file
            status: 'PENDING_VERIFIKASI',
            updatedAt: new Date(),
        })
        .where(eq(purchaseRequests.id, prId));

    await logApproval(prId, session.user.id, 'SUBMIT_PR', 'Cabang submitted approved PR - Pending Verifikasi');

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

/**
 * GA_STAFF uploads verification specification files (multi-file)
 * Transition: PENDING_VERIFIKASI -> PENDING_PENGADAAN
 */
export async function verifikasiSpesifikasi(prId: string, files: File[]) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR not found');

    if (pr.status !== 'PENDING_VERIFIKASI') {
        throw new Error('PR is not in PENDING_VERIFIKASI state');
    }

    if (session.user.role !== 'GA_STAFF') {
        throw new Error('Only GA_STAFF can verify specifications');
    }

    if (files.length === 0) {
        throw new Error('At least one verification file is required');
    }

    // Upload all files
    const uploadPromises = files.map(file => uploadFile(file));
    const verifikasiUrls = await Promise.all(uploadPromises);

    // Store as comma-separated string
    const verifikasiUrlsString = verifikasiUrls.join(',');

    await db.update(purchaseRequests)
        .set({
            verifikasiUrls: verifikasiUrlsString,
            status: 'PENDING_PENGADAAN',
            updatedAt: new Date(),
        })
        .where(eq(purchaseRequests.id, prId));

    await logApproval(prId, session.user.id, 'VERIFIKASI', `Uploaded ${files.length} verification file(s) - Pending Pengadaan`);

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

/**
 * GA_STAFF completes the procurement process (PO, delivery, handover)
 * Transition: PENDING_PENGADAAN -> COMPLETED
 */
export async function selesaikanPengadaan(prId: string, notes?: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR not found');

    if (pr.status !== 'PENDING_PENGADAAN') {
        throw new Error('PR is not in PENDING_PENGADAAN state');
    }

    if (session.user.role !== 'GA_STAFF') {
        throw new Error('Only GA_STAFF can complete procurement');
    }

    await db.update(purchaseRequests)
        .set({
            status: 'COMPLETED',
            updatedAt: new Date(),
        })
        .where(eq(purchaseRequests.id, prId));

    await logApproval(prId, session.user.id, 'COMPLETE', notes || 'Procurement completed - Barang serah terima');

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

/**
 * Reject a PR at any stage
 * Transition: Any -> REJECTED
 */
export async function rejectPurchaseRequest(prId: string, notes: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR not found');

    // Validate permission based on current status
    const canReject = (
        (pr.status === 'PENDING_GAMBAR' && session.user.role === 'GA_STAFF') ||
        (pr.status === 'PENDING_RAB' && session.user.role === 'GA_STAFF') ||
        (pr.status === 'PENDING_GA_MANAGER' && session.user.role === 'GA_MANAGER') ||
        (pr.status === 'PENDING_CABANG_PR' && session.user.role === 'CABANG') ||
        (pr.status === 'PENDING_VERIFIKASI' && session.user.role === 'GA_STAFF') ||
        (pr.status === 'PENDING_PENGADAAN' && session.user.role === 'GA_STAFF')
    );

    if (!canReject) {
        throw new Error('You do not have permission to reject this PR at this stage.');
    }

    await db.update(purchaseRequests)
        .set({ status: 'REJECTED', updatedAt: new Date() })
        .where(eq(purchaseRequests.id, prId));

    await logApproval(prId, session.user.id, 'REJECT', notes || 'Rejected PR');

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

/**
 * Request revision on a PR
 * Transition: Any -> REVISION
 */
export async function requestRevision(prId: string, notes: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR not found');

    // Similar permission logic as reject
    const canRequestRevision = (
        (pr.status === 'PENDING_GAMBAR' && session.user.role === 'GA_STAFF') ||
        (pr.status === 'PENDING_RAB' && session.user.role === 'GA_STAFF') ||
        (pr.status === 'PENDING_GA_MANAGER' && session.user.role === 'GA_MANAGER') ||
        (pr.status === 'PENDING_CABANG_PR' && session.user.role === 'CABANG') ||
        (pr.status === 'PENDING_VERIFIKASI' && session.user.role === 'GA_STAFF') ||
        (pr.status === 'PENDING_PENGADAAN' && session.user.role === 'GA_STAFF')
    );

    if (!canRequestRevision) {
        throw new Error('You do not have permission to request revision on this PR.');
    }

    await db.update(purchaseRequests)
        .set({ status: 'REVISION', updatedAt: new Date() })
        .where(eq(purchaseRequests.id, prId));

    await logApproval(prId, session.user.id, 'REVISION', notes || 'Requested revision');

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}
