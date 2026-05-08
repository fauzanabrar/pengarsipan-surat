import { db } from '@/db';
import { purchaseRequests, approvalLogs, users, prItems } from '@/db/schema';
import { auth } from '@/auth';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PRActionButtons } from './pr-actions';
import { PRStatusBadge } from '@/features/pr/components/status-badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink, FileText, CheckCircle2, Circle, Clock, ReceiptText, AlertCircle } from 'lucide-react';

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

const ApprovedBadge = () => (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 mt-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 dark:text-green-300 dark:bg-green-900/30 dark:border-green-900/50 rounded-md">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Disetujui
    </div>
);

const StatusBadge = ({ status, notes }: { status: 'REJECTED' | 'REVISION', notes?: string | null }) => (
    <div className={`mt-2 p-3 rounded-md border text-sm space-y-1 ${
        status === 'REJECTED' 
        ? 'bg-destructive/10 border-destructive/20 text-red-700 dark:text-red-400 dark:bg-destructive/20 dark:border-destructive/30' 
        : 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-900/50 dark:text-yellow-300'
    }`}>
        <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            {status === 'REJECTED' ? 'Permohonan Ditolak' : 'Menunggu Revisi'}
        </div>
        {notes && (
            <p className="text-xs opacity-90 pl-6">{notes}</p>
        )}
    </div>
);

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

    // Items for RAB
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
    const isPending = pr.status.startsWith('PENDING_') || pr.status === 'REVISION';

    const renderFileLink = (url: string | null, label: string, key?: string) => {
        if (!url) return null;
        
        return (
            <div key={key} className="flex items-center gap-3 p-3 mt-2 bg-muted/50 border rounded-md">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex-1 truncate"
                >
                    {label}
                </a>
                <Button variant="secondary" size="sm" className="gap-2 shrink-0" asChild>
                    <Link href={url} target="_blank" rel="noopener noreferrer">
                        <span className="hidden sm:inline">Lihat File</span>
                        <ExternalLink className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
        );
    };

    const renderMultiFiles = (urls: string | null, labelPrefix: string) => {
        if (!urls) return null;
        const urlList = urls.split(',').filter(Boolean);
        return urlList.map((url, idx) => renderFileLink(url, `${labelPrefix} ${idx + 1}`, `file-${idx}`));
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    const totalAmount = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

    // Calculate active stage index based on current status
    const getActiveIndex = (): number => {
        switch (pr.status) {
            case 'PENDING_GAMBAR': return 1;
            case 'PENDING_RAB': return 2;
            case 'PENDING_GA_MANAGER': return 3;
            case 'PENDING_CABANG_PR': return 4;
            case 'PENDING_VERIFIKASI': return 5;
            case 'PENDING_PENGADAAN': return 6;
            case 'COMPLETED': return 7;
            case 'REJECTED':
            case 'REVISION':
                if (pr.verifikasiUrls || pr.keteranganVerifikasi) return 6;
                if (pr.prUrl || pr.keteranganPr) return 5;
                if (pr.gaManagerApprovalUrl || pr.keteranganGaManager) return 4;
                if (pr.rabUrl || pr.keteranganRab) return 3;
                if (pr.gambarUrl || pr.keteranganGambar) return 2;
                return 1;
            default: return 1;
        }
    };
    const activeIndex = getActiveIndex();

    // Determine the most recent reject/revision note
    const exceptionLog = logs.find(l => l.log.action === 'REJECT' || l.log.action === 'REVISION');
    const exceptionNotes = exceptionLog?.log.notes;

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{pr.title}</h2>
                    <p className="text-muted-foreground mt-2">
                        Diajukan oleh {requester?.name || requester?.username} 
                        {requester?.location ? ` (${requester.location})` : ''} pada {new Date(pr.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div>
                    <PRStatusBadge status={pr.status} />
                </div>
            </div>

            {/* Action Buttons */}
            {isPending && (
                <div className="flex flex-col sm:flex-row bg-primary/5 p-4 rounded-lg border border-primary/20 sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="font-semibold text-sm text-primary">Tindakan Diperlukan</h4>
                        <p className="text-xs text-muted-foreground">Status saat ini: {pr.status.replace(/_/g, ' ')}.</p>
                    </div>
                    <PRActionButtons prId={pr.id} status={pr.status} userRole={session.user.role as 'CABANG' | 'GA_STAFF' | 'GA_MANAGER'} />
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                <div className="col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alur Pengadaan</CardTitle>
                            <CardDescription>Lacak tahapan dokumen pengadaan ini.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="pl-2">
                                <TimelineStep 
                                    title="1. Permohonan Diajukan (CABANG)" 
                                    isCompleted={activeIndex > 0 || pr.status === 'COMPLETED'} 
                                    isActive={activeIndex === 0 && pr.status !== 'COMPLETED'}
                                >
                                    <div className="mt-2 text-sm space-y-2">
                                        {pr.keteranganPengajuan && (
                                            <p className="text-muted-foreground bg-muted/30 p-3 rounded-md border-l-2 border-primary">
                                                {pr.keteranganPengajuan}
                                            </p>
                                        )}
                                        {renderFileLink(pr.suratCabangUrl, 'Surat Permohonan Cabang')}
                                        {(activeIndex > 0 || pr.status === 'COMPLETED') && !pr.suratCabangUrl && <ApprovedBadge />}
                                        {(pr.status === 'REJECTED' || pr.status === 'REVISION') && activeIndex === 0 && (
                                            <StatusBadge status={pr.status as 'REJECTED' | 'REVISION'} notes={exceptionNotes} />
                                        )}
                                    </div>
                                </TimelineStep>

                                <TimelineStep 
                                    title="2. Gambar & Desain (GA STAFF)" 
                                    isCompleted={activeIndex > 1 || pr.status === 'COMPLETED'} 
                                    isActive={activeIndex === 1 && pr.status !== 'COMPLETED'}
                                >
                                    <div className="mt-2 text-sm space-y-2">
                                        {pr.keteranganGambar && (
                                            <p className="text-muted-foreground bg-muted/30 p-3 rounded-md border-l-2 border-primary">
                                                {pr.keteranganGambar}
                                            </p>
                                        )}
                                        {renderFileLink(pr.gambarUrl, 'Gambar / Desain Perencanaan')}
                                        {(activeIndex > 1 || pr.status === 'COMPLETED') && !pr.gambarUrl && <ApprovedBadge />}
                                        {(pr.status === 'REJECTED' || pr.status === 'REVISION') && activeIndex === 1 && (
                                            <StatusBadge status={pr.status as 'REJECTED' | 'REVISION'} notes={exceptionNotes} />
                                        )}
                                    </div>
                                </TimelineStep>

                                <TimelineStep 
                                    title="3. Pembuatan RAB (GA STAFF)" 
                                    isCompleted={activeIndex > 2 || pr.status === 'COMPLETED'} 
                                    isActive={activeIndex === 2 && pr.status !== 'COMPLETED'}
                                >
                                    <div className="mt-2 text-sm space-y-2">
                                        {pr.keteranganRab && (
                                            <p className="text-muted-foreground bg-muted/30 p-3 rounded-md border-l-2 border-primary">
                                                {pr.keteranganRab}
                                            </p>
                                        )}
                                        {renderFileLink(pr.rabUrl, 'Dokumen RAB (Rencana Anggaran Biaya)')}
                                        {(activeIndex > 2 || pr.status === 'COMPLETED') && !pr.rabUrl && <ApprovedBadge />}
                                        {(pr.status === 'REJECTED' || pr.status === 'REVISION') && activeIndex === 2 && (
                                            <StatusBadge status={pr.status as 'REJECTED' | 'REVISION'} notes={exceptionNotes} />
                                        )}
                                    </div>
                                </TimelineStep>

                                <TimelineStep 
                                    title="4. Approval GA Manager" 
                                    isCompleted={activeIndex > 3 || pr.status === 'COMPLETED'} 
                                    isActive={activeIndex === 3 && pr.status !== 'COMPLETED'}
                                >
                                    <div className="mt-2 text-sm space-y-2">
                                        {pr.keteranganGaManager && (
                                            <p className="text-muted-foreground bg-muted/30 p-3 rounded-md border-l-2 border-primary">
                                                {pr.keteranganGaManager}
                                            </p>
                                        )}
                                        {renderFileLink(pr.gaManagerApprovalUrl, 'Approval GA Manager')}
                                        {(activeIndex > 3 || pr.status === 'COMPLETED') && !pr.gaManagerApprovalUrl && <ApprovedBadge />}
                                        {(pr.status === 'REJECTED' || pr.status === 'REVISION') && activeIndex === 3 && (
                                            <StatusBadge status={pr.status as 'REJECTED' | 'REVISION'} notes={exceptionNotes} />
                                        )}
                                    </div>
                                </TimelineStep>

                                <TimelineStep 
                                    title="5. Upload PR Approved (CABANG)" 
                                    isCompleted={activeIndex > 4 || pr.status === 'COMPLETED'} 
                                    isActive={activeIndex === 4 && pr.status !== 'COMPLETED'}
                                >
                                    <div className="mt-2 text-sm space-y-2">
                                        {pr.keteranganPr && (
                                            <p className="text-muted-foreground bg-muted/30 p-3 rounded-md border-l-2 border-primary">
                                                {pr.keteranganPr}
                                            </p>
                                        )}
                                        {renderFileLink(pr.prUrl, 'Dokumen Purchase Request Final')}
                                        {(activeIndex > 4 || pr.status === 'COMPLETED') && !pr.prUrl && <ApprovedBadge />}
                                        {(pr.status === 'REJECTED' || pr.status === 'REVISION') && activeIndex === 4 && (
                                            <StatusBadge status={pr.status as 'REJECTED' | 'REVISION'} notes={exceptionNotes} />
                                        )}
                                    </div>
                                </TimelineStep>

                                <TimelineStep 
                                    title="6. Verifikasi Spesifikasi (GA STAFF)" 
                                    isCompleted={activeIndex > 5 || pr.status === 'COMPLETED'} 
                                    isActive={activeIndex === 5 && pr.status !== 'COMPLETED'}
                                >
                                    <div className="mt-2 text-sm space-y-2">
                                        {pr.keteranganVerifikasi && (
                                            <p className="text-muted-foreground bg-muted/30 p-3 rounded-md border-l-2 border-primary">
                                                {pr.keteranganVerifikasi}
                                            </p>
                                        )}
                                        {renderMultiFiles(pr.verifikasiUrls, 'Dokumen Verifikasi')}
                                        {(activeIndex > 5 || pr.status === 'COMPLETED') && !pr.verifikasiUrls && <ApprovedBadge />}
                                        {(pr.status === 'REJECTED' || pr.status === 'REVISION') && activeIndex === 5 && (
                                            <StatusBadge status={pr.status as 'REJECTED' | 'REVISION'} notes={exceptionNotes} />
                                        )}
                                    </div>
                                </TimelineStep>

                                <TimelineStep 
                                    title="7. Selesai / Pengadaan" 
                                    isCompleted={pr.status === 'COMPLETED'} 
                                    isActive={activeIndex === 6 && pr.status !== 'COMPLETED'}
                                >
                                    <div className="mt-2 text-sm space-y-2">
                                        {pr.keteranganSelesai && (
                                            <p className="text-muted-foreground bg-muted/30 p-3 rounded-md border-l-2 border-primary">
                                                {pr.keteranganSelesai}
                                            </p>
                                        )}
                                        {(pr.status === 'REJECTED' || pr.status === 'REVISION') && activeIndex === 6 && (
                                            <StatusBadge status={pr.status as 'REJECTED' | 'REVISION'} notes={exceptionNotes} />
                                        )}
                                    </div>
                                </TimelineStep>
                            </div>
                        </CardContent>
                    </Card>

                    {items.length > 0 && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <ReceiptText className="h-5 w-5 text-primary" />
                                            Item Pengadaan (RAB)
                                        </CardTitle>
                                        <CardDescription>Detail barang/jasa yang direncanakan.</CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Anggaran</p>
                                        <p className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium">Item</th>
                                                <th className="px-4 py-3 text-center font-medium">Qty</th>
                                                <th className="px-4 py-3 text-right font-medium">Harga Satuan</th>
                                                <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-3 font-medium">{item.name}</td>
                                                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right">{formatCurrency(item.price)}</td>
                                                    <td className="px-4 py-3 text-right font-semibold">
                                                        {formatCurrency(Number(item.price) * item.quantity)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="h-fit">
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
        </div>
    );
}
