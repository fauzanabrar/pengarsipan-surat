import { eq, or, SQL, and, inArray } from 'drizzle-orm';
import { purchaseRequests } from '@/db/schema';

/**
 * Returns the visibility conditions based on user role.
 * CABANG: Only see their own requests.
 * GA_STAFF/GA_MANAGER: Can see all requests in the system.
 */
export function getVisibilityConditions(userId: string, userRole: string): SQL {
    // All roles can now see everything in the system
    return undefined as unknown as SQL;
}

/**
 * Returns conditions for the "Action Required" (Todo) queue.
 */
export function getActionRequiredConditions(userId: string, userRole: string): SQL {
    const requesterNeedsAction = and(
        eq(purchaseRequests.requesterId, userId),
        or(
            eq(purchaseRequests.status, 'PENDING_CABANG_PR'),
            eq(purchaseRequests.status, 'REVISION')
        )
    );

    if (userRole === 'GA_STAFF') {
        return or(
            requesterNeedsAction,
            inArray(purchaseRequests.status, [
                'PENDING_GAMBAR',
                'PENDING_RAB',
                'PENDING_VERIFIKASI',
                'PENDING_PENGADAAN'
            ])
        ) as SQL;
    }
    
    if (userRole === 'GA_MANAGER') {
        return or(
            requesterNeedsAction,
            eq(purchaseRequests.status, 'PENDING_GA_MANAGER')
        ) as SQL;
    }

    if (userRole === 'CABANG') {
        return requesterNeedsAction as SQL;
    }

    return undefined as unknown as SQL;
}
