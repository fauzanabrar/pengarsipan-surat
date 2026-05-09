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
import { ExternalLink, FileText, CheckCircle2, Circle, Clock, ReceiptText, AlertCircle, History } from 'lucide-react';
import { PRFileActions } from './file-actions';
import { PREditableNote, PREditableStatusNote } from './note-actions';
import { BreadcrumbSetter } from '@/components/breadcrumb-setter';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

const StatusBadge = ({ prId, logId, status, notes, canEdit }: { prId: string, logId: string, status: 'REJECTED' | 'REVISION', notes?: string | null, canEdit: boolean }) => (
    <div className={`mt-2 p-3 rounded-md border text-sm space-y-1 ${
        status === 'REJECTED' 
        ? 'bg-destructive/10 border-destructive/20 text-red-700 dark:text-red-400 dark:bg-destructive/20 dark:border-destructive/30' 
        : 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-900/50 dark:text-yellow-300'
    }`}>
        <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            {status === 'REJECTED' ? 'Permohonan Ditolak' : 'Menunggu Revisi'}
        </div>
        <PREditableStatusNote prId={prId} logId={logId} initialValue={notes ?? null} canEdit={canEdit} />
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

    const renderFileLink = (url: string | null, label: string, field: string, canEdit: boolean, canDelete: boolean = false, key?: string) => {
        if (!url) return null;
        
        return (
            <div key={key} className="flex items-center gap-3 p-3 mt-2 bg-muted/50 border rounded-md group/file">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline block truncate"
                    >
                        {label}
                    </a>
                </div>
                
                <PRFileActions 
                    prId={pr.id} 
                    field={field} 
                    canEdit={canEdit && pr.status !== 'COMPLETED'} 
                    canDelete={canDelete && pr.status !== 'COMPLETED'} 
                />

                <Button variant="secondary" size="sm" className="gap-2 shrink-0" asChild>
                    <Link href={url} target="_blank" rel="noopener noreferrer">
                        <span className="hidden sm:inline">Lihat File</span>
                        <ExternalLink className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
        );
    };

    const renderMultiFiles = (urls: string | null, labelPrefix: string, field: string, canEdit: boolean) => {
        if (!urls) return null;
        const urlList = urls.split(',').filter(Boolean);
        return urlList.map((url, idx) => renderFileLink(url, `${labelPrefix} ${idx + 1}`, field, canEdit, true, `file-${idx}`));
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
        const statusMap: Record<string, number> = {
            'PENDING_GAMBAR': 1,
            'PENDING_RAB': 2,
            'PENDING_GA_MANAGER': 3,
            'PENDING_CABANG_PR': 4,
            'PENDING_VERIFIKASI': 5,
            'PENDING_PENGADAAN': 6,
            'COMPLETED': 7,
        };

        if (statusMap[pr.status]) return statusMap[pr.status];

        // Handle REJECTED/REVISION (return index based on furthest completed field)
        if (pr.verifikasiUrls || pr.keteranganVerifikasi) return 6;
        if (pr.prUrl || pr.keteranganPr) return 5;
        if (pr.gaManagerApprovalUrl || pr.keteranganGaManager) return 4;
        if (pr.rabUrl || pr.keteranganRab) return 3;
        if (pr.gambarUrl || pr.keteranganGambar) return 2;
        return 1;
    };
    const activeIndex = getActiveIndex();

    // Map logs to their respective steps
    const logStepMapping = new Map<string, number>();
    let inferredStep = 0;
    
    // Traverse from oldest to newest to reconstruct history
    [...logs].reverse().forEach(({ log }) => {
        if (log.action === 'AJUKAN') { inferredStep = 0; logStepMapping.set(log.id, 0); }
        else if (log.action === 'UPLOAD_GAMBAR') { inferredStep = 1; logStepMapping.set(log.id, 1); }
        else if (log.action === 'CREATE_RAB') { inferredStep = 2; logStepMapping.set(log.id, 2); }
        else if (log.action === 'APPROVE_GA_MANAGER') { inferredStep = 3; logStepMapping.set(log.id, 3); }
        else if (log.action === 'SUBMIT_PR') { inferredStep = 4; logStepMapping.set(log.id, 4); }
        else if (log.action === 'VERIFIKASI') { inferredStep = 5; logStepMapping.set(log.id, 5); }
        else if (log.action === 'COMPLETE') { inferredStep = 6; logStepMapping.set(log.id, 6); }
        else if (log.action === 'UPDATE_FILE' && log.notes) {
            if (log.notes.includes('suratCabang') || log.notes.includes('Pengajuan')) logStepMapping.set(log.id, 0);
            else if (log.notes.includes('gambar') || log.notes.includes('Gambar')) logStepMapping.set(log.id, 1);
            else if (log.notes.includes('rab') || log.notes.includes('Rab')) logStepMapping.set(log.id, 2);
            else if (log.notes.includes('gaManager') || log.notes.includes('GaManager')) logStepMapping.set(log.id, 3);
            else if (log.notes.includes('prUrl') || log.notes.includes('keteranganPr')) logStepMapping.set(log.id, 4);
            else if (log.notes.includes('verifikasi') || log.notes.includes('Verifikasi')) logStepMapping.set(log.id, 5);
            else if (log.notes.includes('Selesai')) logStepMapping.set(log.id, 6);
            else logStepMapping.set(log.id, inferredStep);
        } else if (log.action === 'REVISION' || log.action === 'REJECT') {
            logStepMapping.set(log.id, Math.min(inferredStep + 1, 6));
        } else {
            logStepMapping.set(log.id, inferredStep);
        }
    });

    const getActionLabel = (log: typeof approvalLogs.$inferSelect) => {
        if (log.action === 'UPDATE_FILE') {
            if (!log.notes) return 'memperbarui data';
            if (log.notes.includes('suratCabang')) return 'mengubah file Surat Permohonan';
            if (log.notes.includes('keteranganPengajuan')) return 'mengubah keterangan Pengajuan';
            if (log.notes.includes('gambarUrl')) return 'mengubah file Gambar/Desain';
            if (log.notes.includes('keteranganGambar')) return 'mengubah keterangan Gambar';
            if (log.notes.includes('rabUrl')) return 'mengubah file RAB';
            if (log.notes.includes('keteranganRab')) return 'mengubah keterangan RAB';
            if (log.notes.includes('gaManagerApprovalUrl')) return 'mengubah file Approval Manager';
            if (log.notes.includes('keteranganGaManager')) return 'mengubah keterangan Approval Manager';
            if (log.notes.includes('prUrl')) return 'mengubah file PR Final';
            if (log.notes.includes('keteranganPr')) return 'mengubah keterangan PR Final';
            if (log.notes.includes('verifikasiUrls')) return 'mengubah file Verifikasi';
            if (log.notes.includes('keteranganVerifikasi')) return 'mengubah keterangan Verifikasi';
            if (log.notes.includes('keteranganSelesai')) return 'mengubah keterangan Penyelesaian';
            return 'memperbarui data';
        }

        const labels: Record<string, string> = {
            'AJUKAN': 'mengajukan permohonan',
            'UPLOAD_GAMBAR': 'mengunggah gambar/desain',
            'CREATE_RAB': 'membuat RAB',
            'APPROVE_GA_MANAGER': 'menyetujui anggaran',
            'SUBMIT_PR': 'mengunggah dokumen PR',
            'VERIFIKASI': 'memverifikasi spesifikasi',
            'COMPLETE': 'menyelesaikan pengadaan',
            'REJECT': 'menolak permohonan',
            'REVISION': 'meminta revisi',
        };
        return labels[log.action] || log.action;
    };

    // Determine the most recent reject/revision note
    const exceptionLog = logs.find(l => l.log.action === 'REJECT' || l.log.action === 'REVISION');
    const exceptionNotes = exceptionLog?.log.notes;
    const exceptionLogId = exceptionLog?.log.id;
    const canEditException = exceptionLog?.log.actorId === session.user.id || session.user.role === 'GA_MANAGER';

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto">
            <BreadcrumbSetter title={pr.title} />
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
                    <PRActionButtons prId={pr.id} status={pr.status} userRole={session.user.role as any} isOwner={pr.requesterId === session.user.id} />
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                <div className="col-span-1 lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alur Pengadaan</CardTitle>
                            <CardDescription>Lacak tahapan dokumen pengadaan ini.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="pl-2">
                                {[
                                    {
                                        title: "1. Permohonan Diajukan (CABANG)",
                                        index: 0,
                                        noteField: "keteranganPengajuan" as const,
                                        noteValue: pr.keteranganPengajuan,
                                        canEdit: pr.requesterId === session.user.id || session.user.role === 'GA_MANAGER',
                                        fileRenderer: () => renderFileLink(pr.suratCabangUrl, 'Surat Permohonan Cabang', 'suratCabangUrl', pr.requesterId === session.user.id || session.user.role === 'GA_MANAGER'),
                                        hasFile: !!pr.suratCabangUrl,
                                    },
                                    {
                                        title: "2. Gambar & Desain (GA STAFF)",
                                        index: 1,
                                        noteField: "keteranganGambar" as const,
                                        noteValue: pr.keteranganGambar,
                                        canEdit: session.user.role === 'GA_STAFF' || session.user.role === 'GA_MANAGER',
                                        fileRenderer: () => renderFileLink(pr.gambarUrl, 'Gambar / Desain Perencanaan', 'gambarUrl', session.user.role === 'GA_STAFF' || session.user.role === 'GA_MANAGER'),
                                        hasFile: !!pr.gambarUrl,
                                    },
                                    {
                                        title: "3. Pembuatan RAB (GA STAFF)",
                                        index: 2,
                                        noteField: "keteranganRab" as const,
                                        noteValue: pr.keteranganRab,
                                        canEdit: session.user.role === 'GA_STAFF' || session.user.role === 'GA_MANAGER',
                                        fileRenderer: () => renderFileLink(pr.rabUrl, 'Dokumen RAB (Rencana Anggaran Biaya)', 'rabUrl', session.user.role === 'GA_STAFF' || session.user.role === 'GA_MANAGER'),
                                        hasFile: !!pr.rabUrl,
                                    },
                                    {
                                        title: "4. Approval GA Manager",
                                        index: 3,
                                        noteField: "keteranganGaManager" as const,
                                        noteValue: pr.keteranganGaManager,
                                        canEdit: session.user.role === 'GA_MANAGER',
                                        fileRenderer: () => renderFileLink(pr.gaManagerApprovalUrl, 'Approval GA Manager', 'gaManagerApprovalUrl', session.user.role === 'GA_MANAGER'),
                                        hasFile: !!pr.gaManagerApprovalUrl,
                                    },
                                    {
                                        title: "5. Upload PR Approved (CABANG)",
                                        index: 4,
                                        noteField: "keteranganPr" as const,
                                        noteValue: pr.keteranganPr,
                                        canEdit: pr.requesterId === session.user.id || session.user.role === 'GA_MANAGER',
                                        fileRenderer: () => renderFileLink(pr.prUrl, 'Dokumen Purchase Request Final', 'prUrl', pr.requesterId === session.user.id || session.user.role === 'GA_MANAGER'),
                                        hasFile: !!pr.prUrl,
                                    },
                                    {
                                        title: "6. Verifikasi Spesifikasi (GA STAFF)",
                                        index: 5,
                                        noteField: "keteranganVerifikasi" as const,
                                        noteValue: pr.keteranganVerifikasi,
                                        canEdit: session.user.role === 'GA_STAFF' || session.user.role === 'GA_MANAGER',
                                        fileRenderer: () => renderMultiFiles(pr.verifikasiUrls, 'Dokumen Verifikasi', 'verifikasiUrls', session.user.role === 'GA_STAFF' || session.user.role === 'GA_MANAGER'),
                                        hasFile: !!pr.verifikasiUrls,
                                    },
                                    {
                                        title: "7. Selesai / Pengadaan",
                                        index: 6,
                                        noteField: "keteranganSelesai" as const,
                                        noteValue: pr.keteranganSelesai,
                                        canEdit: session.user.role === 'GA_STAFF' || session.user.role === 'GA_MANAGER',
                                        fileRenderer: () => null,
                                        hasFile: true, // Special case: no file needed to show approved badge, but we don't show badge here anyway.
                                    }
                                ].map((step) => {
                                    const isCompleted = step.index === 6 ? pr.status === 'COMPLETED' : activeIndex > step.index || pr.status === 'COMPLETED';
                                    const isActive = activeIndex === step.index && pr.status !== 'COMPLETED';
                                    const stepLogs = logs.filter(({ log }) => logStepMapping.get(log.id) === step.index);
                                    const isSystemNote = (note: string | null) => {
                                        if (!note) return true;
                                        const systemNotes = [
                                            'Mengajukan permohonan baru',
                                            'Uploaded drawings/designs',
                                            'Created RAB with items',
                                            'GA Manager approved the budget',
                                            'Cabang uploaded approved PR document',
                                            'GA Staff verified specifications and items',
                                            'Procurement process completed',
                                            'Permohonan ditolak',
                                            'Revisi diperlukan'
                                        ];
                                        return systemNotes.includes(note) || note.startsWith('Updated file') || note.startsWith('Mengubah keterangan:');
                                    };

                                    const isStepReached = activeIndex >= step.index || pr.status === 'COMPLETED';
                                    const canEditStep = step.canEdit && pr.status !== 'COMPLETED' && isStepReached;
                                    const hasNoteValue = step.noteValue && step.noteValue.trim().length > 0;

                                    return (
                                        <TimelineStep 
                                            key={step.index}
                                            title={step.title} 
                                            isCompleted={isCompleted} 
                                            isActive={isActive}
                                        >
                                            <div className="mt-3 text-sm space-y-4">
                                                {/* The main note for this stage (Only show if has content or is editable) */}
                                                {(hasNoteValue || canEditStep) && (
                                                    <div className="bg-muted/10 p-3 rounded-lg border border-border/40 shadow-sm transition-all hover:bg-muted/20">
                                                        <h5 className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                            <FileText className="h-3 w-3" /> Catatan / Keterangan
                                                        </h5>
                                                        <PREditableNote 
                                                            prId={pr.id} 
                                                            field={step.noteField} 
                                                            initialValue={step.noteValue ?? null} 
                                                            canEdit={canEditStep} 
                                                        />
                                                    </div>
                                                )}

                                                {/* Rendered files */}
                                                {step.hasFile && (
                                                    <div className="space-y-2">
                                                        {step.fileRenderer()}
                                                    </div>
                                                )}
                                                
                                                {/* Approved Badge (only if passed this step and no file was uploaded) */}
                                                {(activeIndex > step.index || pr.status === 'COMPLETED') && !step.hasFile && step.index !== 6 && (
                                                    <ApprovedBadge />
                                                )}

                                                {/* Exception Badge (Reject/Revision) */}
                                                {(pr.status === 'REJECTED' || pr.status === 'REVISION') && activeIndex === step.index && exceptionLogId && (
                                                    <StatusBadge 
                                                        prId={pr.id} 
                                                        logId={exceptionLogId} 
                                                        status={pr.status as any} 
                                                        notes={exceptionNotes} 
                                                        canEdit={canEditException} 
                                                    />
                                                )}

                                                {/* Thread Activity Logs */}
                                                {stepLogs.length > 0 && (
                                                    <div className="pt-3 pb-1">
                                                        <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                                            <History className="h-3 w-3" /> Riwayat Aktivitas
                                                        </h5>
                                                        <div className="space-y-5 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-border/60">
                                                            {stepLogs.map(({ log, actor }) => {
                                                                const isSystem = isSystemNote(log.notes);
                                                                return (
                                                                    <div key={log.id} className="flex gap-3 items-center relative z-10">
                                                                        <Avatar className="h-6 w-6 border bg-background ring-4 ring-background">
                                                                            <AvatarFallback className="text-[9px] font-bold text-primary bg-primary/10">
                                                                                {(actor?.name || 'U').charAt(0).toUpperCase()}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                                                            <p className="text-[13px] leading-relaxed text-foreground/90 truncate">
                                                                                <span className="font-bold">{actor?.name || 'Sistem'}</span>{' '}
                                                                                <span className="text-muted-foreground">{getActionLabel(log)}</span>
                                                                            </p>
                                                                            <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-md whitespace-nowrap shadow-sm">
                                                                                {new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TimelineStep>
                                    );
                                })}
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
            </div>
        </div>
    );
}
