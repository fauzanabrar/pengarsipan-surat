import { eq, or, SQL, ne, and } from 'drizzle-orm';
import { purchaseRequests } from '@/db/schema';

/**
 * Returns the visibility conditions based on user role.
 * CABANG: Only see their own requests.
 * GA_STAFF/GA_MANAGER: Can see all requests in the system.
 */
export function getVisibilityConditions(userId: string, userRole: string): SQL {
    if (userRole === 'CABANG' || userRole === 'GA_STAFF') {
        // CABANG and GA_STAFF see their own requests by default
        // But GA_STAFF has special visibility in the "All" tab (handled in page logic)
        if (userRole === 'CABANG') return eq(purchaseRequests.requesterId, userId);
    }
    // GA_MANAGER can see everything, GA_STAFF can also see everything in the "All" view
    return undefined as unknown as SQL;
}

/**
 * Returns conditions for the "Action Required" (Todo) queue.
 */
export function getActionRequiredConditions(userId: string, userRole: string): SQL {
    if (userRole === 'GA_STAFF') {
        return or(
            eq(purchaseRequests.status, 'MENUNGGU_RAB'),
            eq(purchaseRequests.status, 'MENUNGGU_PR')
        ) as SQL;
    }
    
    if (userRole === 'GA_MANAGER') {
        return eq(purchaseRequests.status, 'MENUNGGU_DIVERIFIKASI');
    }

    if (userRole === 'CABANG') {
        // For CABANG, "Action Required" might mean PRs that are still in progress
        return and(
            eq(purchaseRequests.requesterId, userId),
            ne(purchaseRequests.status, 'DITERIMA'),
            ne(purchaseRequests.status, 'DITOLAK')
        ) as SQL;
    }

    return undefined as unknown as SQL;
}
