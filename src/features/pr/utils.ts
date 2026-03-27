import { eq, or } from 'drizzle-orm';
import { purchaseRequests } from '@/db/schema';

// Helper function to dynamically calculate the appropriate PR queries based on user context
export function getRoleBasedQueueConditions(userId: string, userRole: string) {
    let conditions = eq(purchaseRequests.requesterId, userId);
    
    if (userRole === 'MANAGER') {
        conditions = or(conditions, eq(purchaseRequests.status, 'PENDING_MANAGER')) as any;
    } else if (userRole === 'FINANCE') {
        conditions = or(conditions, eq(purchaseRequests.status, 'PENDING_FINANCE')) as any;
    } else if (userRole === 'VP') {
        conditions = or(conditions, eq(purchaseRequests.status, 'PENDING_VP')) as any;
    }

    return conditions;
}
