import { eq, or, SQL, and, inArray } from 'drizzle-orm';
import { purchaseRequests } from '@/db/schema';

/**
 * Returns the visibility conditions based on user role.
 * CABANG: Only see their own requests.
 * GA_STAFF/GA_MANAGER: Can see all requests in the system.
 */
export function getVisibilityConditions(userId: string, userRole: string): SQL {
    if (userRole === 'CABANG') {
        return eq(purchaseRequests.requesterId, userId);
    }
    // GA_MANAGER and GA_STAFF can see everything
    return undefined as unknown as SQL;
}

/**
 * Returns conditions for the "Action Required" (Todo) queue.
 */
export function getActionRequiredConditions(userId: string, userRole: string): SQL {
    if (userRole === 'GA_STAFF') {
        return inArray(purchaseRequests.status, [
            'PENDING_GAMBAR',
            'PENDING_RAB',
            'PENDING_VERIFIKASI',
            'PENDING_PENGADAAN'
        ]) as SQL;
    }
    
    if (userRole === 'GA_MANAGER') {
        return eq(purchaseRequests.status, 'PENDING_GA_MANAGER');
    }

    if (userRole === 'CABANG') {
        // CABANG needs to action PENDING_CABANG_PR and REVISION
        return and(
            eq(purchaseRequests.requesterId, userId),
            or(
                eq(purchaseRequests.status, 'PENDING_CABANG_PR'),
                eq(purchaseRequests.status, 'REVISION')
            )
        ) as SQL;
    }

    return undefined as unknown as SQL;
}
