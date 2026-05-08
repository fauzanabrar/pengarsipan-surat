import { db } from '@/db';
import { purchaseRequests, approvalLogs, users } from '@/db/schema';
import { auth } from '@/auth';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PRActionButtons } from './pr-actions';
import { PRStatusBadge } from '@/features/pr/components/status-badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink, FileText, CheckCircle2, Circle, Clock } from 'lucide-react';

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
    const isPending = pr.status.startsWith('MENUNGGU_');

    // Helper to render file links
    const renderFileLink = (url: string | null, label: string) => {
        if (!url) return null;
        
        return (
            <div className="flex items-center gap-2 p-3 mt-2 bg-muted/50 border rounded-md">
                <FileText className="h-5 w-5 text-primary" />
                <a
                    href={url.startsWith('/') ? url : url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex-1 truncate"
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

    const TimelineStep = ({ title, isActive, isCompleted, children }: { title: string, isActive: boolean, isCompleted: boolean, children?: React.ReactNode }) => {
        return (
            <div className="flex gap-4 relative pb-8 last:pb-0">
                <div className="flex flex-col items-center">
                    <div className="z-10 bg-background">
                        {isCompleted ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : isActive ? (
                            <Clock className="h-6 w-6 text-primary" />
                        ) : (
                            <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                    </div>
                    <div className="absolute top-6 bottom-0 left-3 w-px bg-border -z-0"></div>
                </div>
                <div className={`flex-1 pt-0.5 ${!isActive && !isCompleted ? 'opacity-50' : ''}`}>
                    <h4 className="font-semibold">{title}</h4>
                    {children}
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{pr.title}</h2>
                    <p className="text-muted-foreground mt-2">
                        Diajukan oleh {requester?.name || requester?.username} 
                        {requester?.location || (requester?.role === 'GA_STAFF' ? ' (Head Office)' : (requester?.username === 'cabang' ? ' (Utama)' : (requester?.username ? ` (${requester.username})` : '')))} pada {new Date(pr.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div>
                    <PRStatusBadge status={pr.status} />
                </div>
            </div>

            {/* Action Buttons (Queue execution) */}
            {isPending && (
                <div className="flex flex-col sm:flex-row bg-primary/5 p-4 rounded-lg border border-primary/20 sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="font-semibold text-sm text-primary">Tindakan Diperlukan</h4>
                        <p className="text-xs text-muted-foreground">Pengadaan ini sedang dalam status {pr.status.replace(/_/g, ' ')}.</p>
                    </div>
                    <PRActionButtons prId={pr.id} status={pr.status} userRole={session.user.role} />
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Alur Pengadaan</CardTitle>
                        <CardDescription>Lacak status dokumen pengadaan barang/jasa ini.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="pl-2">
                            <TimelineStep 
                                title="1. Permohonan Diajukan" 
                                isCompleted={true} 
                                isActive={false}
                            >
                                <div className="mt-2 text-sm space-y-2">
                                    {pr.keteranganPengajuan && (
                                        <p className="text-muted-foreground bg-muted/30 p-3 rounded-md border-l-2 border-primary">
                                            {pr.keteranganPengajuan}
                                        </p>
                                    )}
                                    {renderFileLink(pr.suratPengajuanUrl, 'Surat Permohonan Pengajuan')}
                                </div>
                            </TimelineStep>

                            <TimelineStep 
                                title="2. Pembuatan RAB" 
                                isCompleted={pr.status !== 'MENUNGGU_RAB'} 
                                isActive={pr.status === 'MENUNGGU_RAB'}
                            >
                                {pr.rabUrl && (
                                <div className="mt-2 text-sm space-y-2">
                                    {pr.keteranganRab && (
                                        <p className="text-muted-foreground bg-muted/30 p-3 rounded-md border-l-2 border-primary">
                                            {pr.keteranganRab}
                                        </p>
                                    )}
                                    {renderFileLink(pr.rabUrl, 'Dokumen RAB (Rencana Anggaran Biaya)')}
                                </div>
                                )}
                            </TimelineStep>

                            <TimelineStep 
                                title="3. Pembuatan Dokumen PR" 
                                isCompleted={pr.status !== 'MENUNGGU_RAB' && pr.status !== 'MENUNGGU_PR'} 
                                isActive={pr.status === 'MENUNGGU_PR'}
                            >
                                {pr.prUrl && (
                                <div className="mt-2 text-sm space-y-2">
                                    {pr.keteranganPr && (
                                        <p className="text-muted-foreground bg-muted/30 p-3 rounded-md border-l-2 border-primary">
                                            {pr.keteranganPr}
                                        </p>
                                    )}
                                    {renderFileLink(pr.prUrl, 'Dokumen Purchase Request Final')}
                                </div>
                                )}
                            </TimelineStep>

                            <TimelineStep 
                                title="4. Verifikasi Manager" 
                                isCompleted={pr.status === 'DITERIMA' || pr.status === 'DITOLAK'} 
                                isActive={pr.status === 'MENUNGGU_DIVERIFIKASI'}
                            >
                                {pr.keteranganManager && (
                                <div className="mt-2 text-sm">
                                    <p className={`p-3 rounded-md border-l-2 ${pr.status === 'DITOLAK' ? 'bg-red-50 text-red-700 border-red-500 dark:bg-red-950/30 dark:text-red-300' : 'bg-green-50 text-green-700 border-green-500 dark:bg-green-950/30 dark:text-green-300'}`}>
                                        <strong>Catatan Manager:</strong> {pr.keteranganManager}
                                    </p>
                                </div>
                                )}
                            </TimelineStep>
                        </div>
                    </CardContent>
                </Card>

                {/* Audit Trail / Tracking Queue */}
                <Card className="col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Riwayat Aktivitas</CardTitle>
                        <CardDescription>Log tindakan pengguna.</CardDescription>
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
                                            {log.action} oleh {actor?.name || actor?.username}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {log.notes}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(log.createdAt).toLocaleString('id-ID')}
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
