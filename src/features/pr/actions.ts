'use server';

import { db } from '@/db';
import { purchaseRequests, prItems, approvalLogs } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Constants for workflow thresholds
const VP_APPROVAL_THRESHOLD = 5000;

export async function createPurchaseRequest(title: string, description: string, items: {name: string, quantity: number, price: number}[]) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    let totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalAmount = Math.round(totalAmount * 100) / 100; // Fix floating point imprecision

    const [pr] = await db.insert(purchaseRequests).values({
        requesterId: session.user.id,
        title,
        description,
        totalAmount: totalAmount.toString(),
        status: 'PENDING_MANAGER', // Initiates the queue
    }).returning();

    if (items.length > 0) {
        await db.insert(prItems).values(
            items.map(item => ({
                prId: pr.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price.toString(),
            }))
        );
    }

    // Tracking Audit
    await db.insert(approvalLogs).values({
        prId: pr.id,
        actorId: session.user.id,
        action: 'SUBMIT',
        notes: 'Submitted PR for manager review',
    });

    revalidatePath('/dashboard/pr');
    return pr;
}

export async function approvePurchaseRequest(prId: string, notes?: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR Not Found');

    let nextStatus = pr.status;

    // Role-based state machine and queue checking
    if (pr.status === 'PENDING_MANAGER' && session.user.role === 'MANAGER') {
        nextStatus = 'PENDING_FINANCE';
    } else if (pr.status === 'PENDING_FINANCE' && session.user.role === 'FINANCE') {
        if (parseFloat(pr.totalAmount) > VP_APPROVAL_THRESHOLD) {
            nextStatus = 'PENDING_VP';
        } else {
            nextStatus = 'APPROVED';
        }
    } else if (pr.status === 'PENDING_VP' && session.user.role === 'VP') {
        nextStatus = 'APPROVED';
    } else {
        throw new Error('You do not have permission to approve this PR at this stage, or it is not pending your approval.');
    }

    // Update PR
    await db.update(purchaseRequests).set({ status: nextStatus }).where(eq(purchaseRequests.id, prId));

    // Audit Log
    await db.insert(approvalLogs).values({
        prId,
        actorId: session.user.id,
        action: 'APPROVE',
        notes: notes || `Approved. Moved to ${nextStatus}`,
    });

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}

export async function rejectPurchaseRequest(prId: string, notes: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const [pr] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, prId));
    if (!pr) throw new Error('PR Not Found');

    // Validate permission to reject (must be the active approver)
    const canReject = (
        (pr.status === 'PENDING_MANAGER' && session.user.role === 'MANAGER') ||
        (pr.status === 'PENDING_FINANCE' && session.user.role === 'FINANCE') ||
        (pr.status === 'PENDING_VP' && session.user.role === 'VP')
    );

    if (!canReject) {
        throw new Error('You do not have permission to reject this PR at this stage.');
    }

    // Update PR
    await db.update(purchaseRequests).set({ status: 'REJECTED' }).where(eq(purchaseRequests.id, prId));

    // Tracking / Audit Log
    await db.insert(approvalLogs).values({
        prId,
        actorId: session.user.id,
        action: 'REJECT',
        notes: notes || 'Rejected PR',
    });

    revalidatePath('/dashboard/pr');
    revalidatePath(`/dashboard/pr/${prId}`);
}
