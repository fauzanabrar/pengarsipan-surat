import { eq, or, SQL } from 'drizzle-orm';
import { purchaseRequests } from '@/db/schema';

// Helper function to dynamically calculate the appropriate PR queries based on user context
export function getRoleBasedQueueConditions(userId: string, userRole: string): SQL {
    let conditions: SQL = eq(purchaseRequests.requesterId, userId);

    // Each role can see PRs pending their action
    if (userRole === 'GA_STAFF') {
        conditions = or(
            conditions,
            eq(purchaseRequests.status, 'MENUNGGU_RAB'),
            eq(purchaseRequests.status, 'MENUNGGU_PR')
        ) as SQL;
    } else if (userRole === 'GA_MANAGER') {
        conditions = or(
            conditions,
            eq(purchaseRequests.status, 'MENUNGGU_DIVERIFIKASI')
        ) as SQL;
    }

    return conditions;
}
