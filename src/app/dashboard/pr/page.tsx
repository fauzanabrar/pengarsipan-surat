import { db } from '@/db';
import { purchaseRequests, users } from '@/db/schema';
import { auth } from '@/auth';
import { eq, or, and, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PRStatusBadge } from '@/features/pr/components/status-badge';
import { getRoleBasedQueueConditions } from '@/features/pr/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';

// Format number as Indonesian Rupiah
function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export default async function PRQueuePage() {
    const session = await auth();
    if (!session?.user) return null;

    const userRole = session.user.role;
    const userId = session.user.id;

    if (!userId) {
        return <div className="p-8">Error: User ID is missing from session. Please log out and log back in.</div>;
    }

    const conditions = getRoleBasedQueueConditions(userId, userRole);

    const prs = await db.select({
        pr: purchaseRequests,
        requester: users,
    })
    .from(purchaseRequests)
    .leftJoin(users, eq(purchaseRequests.requesterId, users.id))
    .where(conditions)
    .orderBy(desc(purchaseRequests.createdAt));

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Purchase Requests</h2>
                <div className="flex items-center space-x-2">
                    <Link href="/dashboard/pr/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Request
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Requester</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {prs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                                    No purchase requests found in your queue.
                                </TableCell>
                            </TableRow>
                        ) : (
                            prs.map(({ pr, requester }) => (
                                <TableRow key={pr.id}>
                                    <TableCell className="font-medium">{pr.title}</TableCell>
                                    <TableCell>{requester?.name || requester?.username}</TableCell>
                                    <TableCell>{formatRupiah(Number(pr.totalAmount))}</TableCell>
                                    <TableCell><PRStatusBadge status={pr.status}/></TableCell>
                                    <TableCell>{new Date(pr.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/pr/${pr.id}`}>
                                            <Button variant="outline" size="sm">
                                                View
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
