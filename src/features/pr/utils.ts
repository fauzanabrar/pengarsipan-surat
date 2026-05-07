import { eq, or } from 'drizzle-orm';
import { purchaseRequests } from '@/db/schema';

// Helper function to dynamically calculate the appropriate PR queries based on user context
export function getRoleBasedQueueConditions(userId: string, userRole: string) {
    let conditions = eq(purchaseRequests.requesterId, userId);

    // Each role can see PRs pending their action
    if (userRole === 'GA_STAFF') {
        conditions = or(
            conditions,
            eq(purchaseRequests.status, 'PENDING_GAMBAR'),
            eq(purchaseRequests.status, 'PENDING_RAB'),
            eq(purchaseRequests.status, 'PENDING_VERIFIKASI'),
            eq(purchaseRequests.status, 'PENDING_PENGADAAN')
        ) as any;
    } else if (userRole === 'GA_MANAGER') {
        conditions = or(
            conditions,
            eq(purchaseRequests.status, 'PENDING_GA_MANAGER')
        ) as any;
    } else if (userRole === 'CABANG') {
        conditions = or(
            conditions,
            eq(purchaseRequests.status, 'PENDING_CABANG_PR')
        ) as any;
    }

    return conditions;
}
