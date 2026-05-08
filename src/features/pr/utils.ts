import { eq, or, SQL, ne, and } from 'drizzle-orm';
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
    // GA roles can see everything
    return undefined as unknown as SQL; // Returning undefined will result in no filter, showing all
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
