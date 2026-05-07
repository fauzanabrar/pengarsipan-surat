import { db } from '@/db';
import { purchaseRequests, prItems, approvalLogs, users } from '@/db/schema';
import { auth } from '@/auth';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PRActionButtons } from './pr-actions';
import { PRStatusBadge } from '@/features/pr/components/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ExternalLink, FileText, Image } from 'lucide-react';

// Format number as Indonesian Rupiah
function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

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

    // Helper to render file links
    const renderFileLink = (url: string | null, label: string, icon: 'file' | 'image' = 'file') => {
        if (!url) return null;
        
        const Icon = icon === 'image' ? Image : FileText;
        
        return (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <a
                    href={url.startsWith('/') ? url : url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex-1 truncate"
                >
                    {label}
                </a>
                <Button variant="ghost" size="sm" asChild>
                    <Link href={url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
        );
    };

    // Render multiple verification files
    const renderVerifikasiFiles = (urlsString: string | null) => {
        if (!urlsString) return null;
        
        const urls = urlsString.split(',').map(u => u.trim()).filter(u => u !== '');
        
        return (
            <div className="space-y-2">
                {urls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex-1 truncate"
                        >
                            Verification File {index + 1}
                        </a>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                ))}
            </div>
        );
    };

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
                        {items.length > 0 ? (
                            <>
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
                                                <TableCell className="text-right">{formatRupiah(Number(item.price))}</TableCell>
                                                <TableCell className="text-right">{formatRupiah(Number(item.price) * item.quantity)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="flex justify-end mt-4 pt-4 border-t">
                                    <div className="text-lg font-bold">
                                        Total: {formatRupiah(Number(pr.totalAmount))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-sm">No items added yet. RAB will be created by GA Staff.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Uploaded Files */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Uploaded Files</CardTitle>
                        <CardDescription>Documents and files for this PR.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {renderFileLink(pr.suratCabangUrl, 'Surat Cabang', 'file')}
                        {renderFileLink(pr.gambarUrl, 'Gambar/Design', 'image')}
                        {renderFileLink(pr.rabUrl, 'RAB Document', 'file')}
                        {renderFileLink(pr.gaManagerApprovalUrl, 'GA Manager Approval', 'file')}
                        {pr.verifikasiUrls && (
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Verification Files</Label>
                                {renderVerifikasiFiles(pr.verifikasiUrls)}
                            </div>
                        )}
                        {!pr.suratCabangUrl && !pr.gambarUrl && !pr.rabUrl && !pr.gaManagerApprovalUrl && !pr.verifikasiUrls && (
                            <p className="text-muted-foreground text-sm">No files uploaded yet.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Audit Trail / Tracking Queue */}
                <Card className="col-span-7">
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
