import { db } from '@/db';
import { purchaseRequests, prItems, approvalLogs, users } from '@/db/schema';
import { auth } from '@/auth';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PRActionButtons } from './pr-actions'; // We will create this client component next
import { PRStatusBadge } from '@/features/pr/components/status-badge';

export default async function PRDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return null;

    const { id: prId } = await params;

    const [prData] = await db.select({
        pr: purchaseRequests,
        requester: users,
    })
    .from(purchaseRequests)
    .leftJoin(users, eq(purchaseRequests.requesterId, users.id))
    .where(eq(purchaseRequests.id, prId));

    if (!prData) return notFound();

    const items = await db.select().from(prItems).where(eq(prItems.prId, prId));

    // Audit Trail / Tracking Logs
    const logs = await db.select({
        log: approvalLogs,
        actor: users,
    })
    .from(approvalLogs)
    .leftJoin(users, eq(approvalLogs.actorId, users.id))
    .where(eq(approvalLogs.prId, prId))
    .orderBy(desc(approvalLogs.createdAt));

    const { pr, requester } = prData;
    const isPending = pr.status.startsWith('PENDING_');

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{pr.title}</h2>
                    <p className="text-muted-foreground mt-2">
                        Requested by {requester?.name || requester?.username} on {new Date(pr.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div>
                    <PRStatusBadge status={pr.status} />
                </div>
            </div>

            {/* Action Buttons (Queue execution) */}
            {isPending && (
                <div className="flex bg-muted/50 p-4 rounded-lg border items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-sm">Action Required</h4>
                        <p className="text-xs text-muted-foreground">This request is waiting for {pr.status.replace('PENDING_', '')} review.</p>
                    </div>
                    <PRActionButtons prId={pr.id} status={pr.status} userRole={session.user.role} />
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Asset Details</CardTitle>
                        <CardDescription>{pr.description || 'No description provided.'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">${Number(item.price).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">${(Number(item.price) * item.quantity).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex justify-end mt-4 pt-4 border-t">
                            <div className="text-lg font-bold">
                                Total: ${Number(pr.totalAmount).toLocaleString()}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Audit Trail / Tracking Queue */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Tracking & Approvals</CardTitle>
                        <CardDescription>Activity log for this request.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {logs.map(({ log, actor }) => (
                                <div key={log.id} className="flex gap-4">
                                    <div className="mt-1">
                                        <div className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/20" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {log.action} by {actor?.name || actor?.username}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {log.notes}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
