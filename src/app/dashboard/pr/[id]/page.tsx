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
import { ExternalLink, FileText, CheckCircle2, Circle, Clock, ReceiptText, AlertCircle, History, User, MapPin, CalendarDays } from 'lucide-react';
import { PRFileActions } from './file-actions';
import { PREditableNote, PREditableStatusNote } from './note-actions';
import { BreadcrumbSetter } from '@/components/breadcrumb-setter';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollToActive } from './scroll-to-active';

// --- Types & Config ---

const WORKFLOW_STEP_CONFIG = [
    { title: "1. Permohonan Diajukan (CABANG)", index: 0, noteField: "keteranganPengajuan" as const, fileLabel: 'Surat Permohonan Cabang', fileField: 'suratCabangUrl' },
    { title: "2. Gambar & Desain (GA STAFF)", index: 1, noteField: "keteranganGambar" as const, fileLabel: 'Gambar / Desain Perencanaan', fileField: 'gambarUrl' },
    { title: "3. Pembuatan RAB (GA STAFF)", index: 2, noteField: "keteranganRab" as const, fileLabel: 'Dokumen RAB (Rencana Anggaran Biaya)', fileField: 'rabUrl' },
    { title: "4. Approval GA Manager", index: 3, noteField: "keteranganGaManager" as const, fileLabel: 'Approval GA Manager', fileField: 'gaManagerApprovalUrl' },
    { title: "5. Upload PR Approved (CABANG)", index: 4, noteField: "keteranganPr" as const, fileLabel: 'Dokumen Purchase Request Final', fileField: 'prUrl' },
    { title: "6. Verifikasi Spesifikasi (GA STAFF)", index: 5, noteField: "keteranganVerifikasi" as const, fileLabel: 'Dokumen Verifikasi', fileField: 'verifikasiUrls', isMulti: true },
    { title: "7. Selesai / Pengadaan", index: 6, noteField: "keteranganSelesai" as const, fileLabel: '', fileField: '', isFinal: true }
];

const WAITING_MESSAGES: Record<string, string> = {
    'PENDING_GAMBAR': 'GA Staff sedang menyiapkan gambar dan desain perencanaan.',
    'PENDING_RAB': 'GA Staff sedang menyusun Rencana Anggaran Biaya (RAB).',
    'PENDING_GA_MANAGER': 'Menunggu tinjauan dan persetujuan dari GA Manager.',
    'PENDING_CABANG_PR': 'Cabang sedang menyiapkan dan mengunggah dokumen PR Final.',
    'PENDING_VERIFIKASI': 'GA Staff sedang memverifikasi spesifikasi dan kelengkapan dokumen.',
    'PENDING_PENGADAAN': 'GA Staff sedang memproses penyelesaian akhir pengadaan.',
    'REVISION': 'Pengaju sedang melakukan revisi atau perbaikan dokumen.',
};

const ACTION_LABELS: Record<string, string> = {
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

// --- Sub-components ---

const TimelineStep = ({ id, title, isActive, isCompleted, children }: { id?: string, title: string, isActive: boolean, isCompleted: boolean, children?: React.ReactNode }) => (
    <div id={id} className="flex gap-4 relative pb-8 last:pb-0 scroll-mt-20">
        <div className="flex flex-col items-center">
            <div className="z-10 bg-background">
                {isCompleted ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : isActive ? <Clock className="h-6 w-6 text-primary" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
            </div>
            <div className="absolute top-6 bottom-0 left-3 w-px bg-border -z-0"></div>
        </div>
        <div className={`flex-1 pt-0.5 ${!isActive && !isCompleted ? 'opacity-50' : ''}`}>
            <h4 className="font-semibold">{title}</h4>
            {children}
        </div>
    </div>
);

const ApprovedBadge = () => (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 mt-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 dark:text-green-300 dark:bg-green-900/30 dark:border-green-900/50 rounded-md">
        <CheckCircle2 className="h-3.5 w-3.5" /> Disetujui
    </div>
);

const StatusBadge = ({ prId, logId, status, notes, canEdit }: { prId: string, logId: string, status: 'REJECTED' | 'REVISION', notes?: string | null, canEdit: boolean }) => (
    <div className={`mt-2 p-3 rounded-md border text-sm space-y-1 ${status === 'REJECTED' ? 'bg-destructive/10 border-destructive/20 text-red-700 dark:text-red-400 dark:bg-destructive/20 dark:border-destructive/30' : 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-900/50 dark:text-yellow-300'}`}>
        <div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" />{status === 'REJECTED' ? 'Permohonan Ditolak' : 'Menunggu Revisi'}</div>
        <PREditableStatusNote prId={prId} logId={logId} initialValue={notes ?? null} canEdit={canEdit} />
    </div>
);

// --- Helpers ---

const formatCurrency = (amount: string | number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount));

const getActionLabel = (log: typeof approvalLogs.$inferSelect) => {
    if (log.action === 'UPDATE_FILE') {
        if (!log.notes) return 'memperbarui data';
        const nl = log.notes.toLowerCase();
        if (nl.includes('suratcabang')) return 'mengubah file Surat Permohonan';
        if (nl.includes('keteranganpengajuan')) return 'mengubah keterangan Pengajuan';
        if (nl.includes('gambarurl')) return 'mengubah file Gambar/Desain';
        if (nl.includes('keterangangambar')) return 'mengubah keterangan Gambar';
        if (nl.includes('raburl')) return 'mengubah file RAB';
        if (nl.includes('keteranganrab')) return 'mengubah keterangan RAB';
        if (nl.includes('gamanagerapprovalurl')) return 'mengubah file Approval Manager';
        if (nl.includes('keterangangamanager')) return 'mengubah keterangan Approval Manager';
        if (nl.includes('prurl')) return 'mengubah file PR Final';
        if (nl.includes('keteranganpr')) return 'mengubah keterangan PR Final';
        if (nl.includes('verifikasiurls')) return 'mengubah file Verifikasi';
        if (nl.includes('keteranganverifikasi')) return 'mengubah keterangan Verifikasi';
        if (nl.includes('keteranganselesai')) return 'mengubah keterangan Penyelesaian';
        return 'memperbarui data';
    }
    return ACTION_LABELS[log.action] || log.action;
};

// --- Main Component ---

export default async function PRDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return null;

    const { id: prId } = await params;

    const [prData] = await db.select({ pr: purchaseRequests, requester: users })
        .from(purchaseRequests)
        .leftJoin(users, eq(purchaseRequests.requesterId, users.id))
        .where(eq(purchaseRequests.id, prId));

    if (!prData) return notFound();

    const items = await db.select().from(prItems).where(eq(prItems.prId, prId));
    const logs = await db.select({ log: approvalLogs, actor: users })
        .from(approvalLogs)
        .leftJoin(users, eq(approvalLogs.actorId, users.id))
        .where(eq(approvalLogs.prId, prId))
        .orderBy(desc(approvalLogs.createdAt));

    const { pr, requester } = prData;
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

    // 1. Workflow Index
    const getActiveIndex = () => {
        const sm: Record<string, number> = { 'PENDING_GAMBAR': 1, 'PENDING_RAB': 2, 'PENDING_GA_MANAGER': 3, 'PENDING_CABANG_PR': 4, 'PENDING_VERIFIKASI': 5, 'PENDING_PENGADAAN': 6, 'COMPLETED': 7 };
        if (sm[pr.status]) return sm[pr.status];
        if (pr.verifikasiUrls || pr.keteranganVerifikasi) return 6;
        if (pr.prUrl || pr.keteranganPr) return 5;
        if (pr.gaManagerApprovalUrl || pr.keteranganGaManager) return 4;
        if (pr.rabUrl || pr.keteranganRab) return 3;
        if (pr.gambarUrl || pr.keteranganGambar) return 2;
        return 1;
    };
    const activeIndex = getActiveIndex();

    // 2. Log Mapping
    const logStepMapping = new Map<string, number>();
    const logIsRevisionFix = new Map<string, boolean>();
    let inferredStep = 0;
    
    [...logs].reverse().forEach(({ log }) => {
        if (log.action === 'AJUKAN') inferredStep = 0;
        else if (log.action === 'UPLOAD_GAMBAR') inferredStep = 1;
        else if (log.action === 'CREATE_RAB') inferredStep = 2;
        else if (log.action === 'APPROVE_GA_MANAGER') inferredStep = 3;
        else if (log.action === 'SUBMIT_PR') inferredStep = 4;
        else if (log.action === 'VERIFIKASI') inferredStep = 5;
        else if (log.action === 'COMPLETE') inferredStep = 6;
        
        let stepIdx = inferredStep;
        if (log.action === 'UPDATE_FILE' && log.notes) {
            const nl = log.notes.toLowerCase();
            if (nl.includes('suratcabang') || nl.includes('pengajuan')) stepIdx = 0;
            else if (nl.includes('gambar')) stepIdx = 1;
            else if (nl.includes('rab')) stepIdx = 2;
            else if (nl.includes('gamanager')) stepIdx = 3;
            else if (nl.includes('prurl') || nl.includes('keteranganpr')) stepIdx = 4;
            else if (nl.includes('verifikasi')) stepIdx = 5;
            else if (nl.includes('selesai')) stepIdx = 6;
        } else if (log.action === 'REVISION' || log.action === 'REJECT') {
            stepIdx = Math.min(inferredStep + 1, 6);
        }
        logStepMapping.set(log.id, stepIdx);
        inferredStep = Math.max(inferredStep, stepIdx);
    });

    logs.forEach(({ log }, idx) => {
        const stepIdx = logStepMapping.get(log.id)!;
        const isApproverAction = ['VERIFIKASI', 'APPROVE_GA_MANAGER', 'COMPLETE'].includes(log.action);
        if (log.action !== 'REVISION' && log.action !== 'REJECT' && !isApproverAction) {
            const hpr = (s: number) => logs.slice(idx + 1).some(l => logStepMapping.get(l.log.id) === s && (l.log.action === 'REVISION' || l.log.action === 'REJECT'));
            if (hpr(stepIdx) || hpr(stepIdx + 1)) logIsRevisionFix.set(log.id, true);
        }
    });

    const exceptionLog = logs.find(l => l.log.action === 'REJECT' || l.log.action === 'REVISION');
    const completionLog = logs.find(l => l.log.action === 'COMPLETE');

    // 3. Permissions
    const canActionAtActiveStep = (
        (session.user.role === 'GA_STAFF' && ['PENDING_GAMBAR', 'PENDING_RAB', 'PENDING_VERIFIKASI', 'PENDING_PENGADAAN'].includes(pr.status)) ||
        (session.user.role === 'GA_MANAGER' && pr.status === 'PENDING_GA_MANAGER') ||
        (pr.requesterId === session.user.id && (pr.status === 'PENDING_CABANG_PR' || pr.status === 'REVISION'))
    );

    const renderFile = (url: string | null, label: string, field: string, canEdit: boolean, canDelete: boolean = false, key?: string) => {
        if (!url) return null;
        return (
            <div key={key} className="flex items-center gap-3 p-3 mt-2 bg-muted/50 border rounded-md group/file">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0"><a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline block truncate">{label}</a></div>
                <PRFileActions prId={pr.id} field={field} canEdit={canEdit && pr.status !== 'COMPLETED'} canDelete={canDelete && pr.status !== 'COMPLETED'} />
                <Button variant="secondary" size="sm" className="gap-2 shrink-0" asChild><Link href={url} target="_blank" rel="noopener noreferrer"><span className="hidden sm:inline">Lihat File</span><ExternalLink className="h-4 w-4" /></Link></Button>
            </div>
        );
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto">
            <BreadcrumbSetter title={pr.title} />
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{pr.title}</h2>
                    <p className="text-muted-foreground mt-2">Diajukan oleh {requester?.name || requester?.username} {requester?.location ? ` (${requester.location})` : ''} pada {new Date(pr.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <PRStatusBadge status={pr.status} />
            </div>
            <ScrollToActive activeIndex={activeIndex} />

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                <div className="col-span-1 lg:col-span-2 space-y-6">
                    {items.length > 0 && (
                        <Card className="overflow-hidden border shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2 text-primary">
                                            <ReceiptText className="h-5 w-5" /> 
                                            Item Pengadaan (RAB)
                                        </CardTitle>
                                        <CardDescription>Rincian barang atau jasa yang diajukan.</CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Anggaran</p>
                                        <p className="text-2xl font-black text-primary tabular-nums">{formatCurrency(totalAmount)}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto border-t">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Nama Item</th>
                                                <th className="px-4 py-3 text-center font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Qty</th>
                                                <th className="px-4 py-3 text-right font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Harga Satuan</th>
                                                <th className="px-4 py-3 text-right font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {items.map((item) => (
                                                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3.5 font-semibold text-foreground">{item.name}</td>
                                                    <td className="px-4 py-3.5 text-center font-medium">{item.quantity}</td>
                                                    <td className="px-4 py-3.5 text-right text-muted-foreground">{formatCurrency(item.price)}</td>
                                                    <td className="px-4 py-3.5 text-right font-bold text-primary tabular-nums">{formatCurrency(Number(item.price) * item.quantity)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="shadow-sm border-muted/20">
                        <CardHeader className="border-b border-muted/20 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                    <History className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle>Alur Pengadaan</CardTitle>
                                    <CardDescription>Lacak tahapan dokumen pengadaan ini.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="pl-2">
                                {WORKFLOW_STEP_CONFIG.map((step) => {
                                    const isCompleted = step.index === 6 ? pr.status === 'COMPLETED' : activeIndex > step.index || pr.status === 'COMPLETED';
                                    const isActive = activeIndex === step.index && pr.status !== 'COMPLETED';
                                    const isStepReached = activeIndex >= step.index || pr.status === 'COMPLETED';
                                    const stepValue = (pr as any)[step.noteField];
                                    const canEditStep = (step.index === 0 || step.index === 4) 
                                        ? (pr.requesterId === session.user.id || (session.user.role as string) === 'GA_MANAGER')
                                        : ((session.user.role as string) === 'GA_STAFF' || (session.user.role as string) === 'GA_MANAGER');
                                    const canEditThisNow = canEditStep && pr.status !== 'COMPLETED' && isStepReached;
                                    const stepLogs = logs.filter(({ log }) => {
                                        const mappedIdx = logStepMapping.get(log.id);
                                        return step.index === 5 && mappedIdx === 4 ? logIsRevisionFix.get(log.id) : mappedIdx === step.index;
                                    });

                                    return (
                                        <TimelineStep key={step.index} id={`step-${step.index}`} title={step.title} isCompleted={isCompleted} isActive={isActive}>
                                            <div className="mt-3 text-sm space-y-4">
                                                {isActive && (
                                                    <div className={`p-4 rounded-lg border transition-all duration-300 ${canActionAtActiveStep ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 shadow-sm animate-in fade-in slide-in-from-top-1' : 'bg-muted/20 border-dashed border-muted-foreground/20'}`}>
                                                        <div className="w-full mb-2"><h5 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${canActionAtActiveStep ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}>{canActionAtActiveStep ? <><AlertCircle className="h-3 w-3" /> Tindakan Diperlukan</> : <><Clock className="h-3 w-3" /> Status</>}</h5></div>
                                                        {canActionAtActiveStep ? (
                                                            <div className="flex flex-wrap items-center gap-3"><PRActionButtons prId={pr.id} status={pr.status} userRole={session.user.role as any} isOwner={pr.requesterId === session.user.id} /></div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-muted-foreground"><div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-pulse" /><p className="text-sm italic">{WAITING_MESSAGES[pr.status] || 'Proses sedang berjalan ke tahap berikutnya.'}</p></div>
                                                        )}
                                                    </div>
                                                )}
                                                {(stepValue || canEditThisNow) && !( (pr.status === 'REJECTED' || pr.status === 'REVISION') && isActive && exceptionLog) && (
                                                    <div className="bg-muted/10 p-3 rounded-lg border border-border/40 shadow-sm">
                                                        <h5 className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FileText className="h-3 w-3" /> Catatan / Keterangan</h5>
                                                        <PREditableNote prId={pr.id} field={step.noteField} initialValue={stepValue ?? null} canEdit={canEditThisNow} />
                                                    </div>
                                                )}
                                                {step.fileField && (step.isMulti ? (pr as any)[step.fileField]?.split(',').filter(Boolean).map((u: string, i: number) => renderFile(u, `${step.fileLabel} ${i+1}`, step.fileField, canEditThisNow, true, `f-${step.index}-${i}`)) : renderFile((pr as any)[step.fileField], step.fileLabel, step.fileField, canEditThisNow))}
                                                {(activeIndex > step.index || pr.status === 'COMPLETED') && !step.fileField && !step.isFinal && <ApprovedBadge />}
                                                {(pr.status === 'REJECTED' || pr.status === 'REVISION') && isActive && exceptionLog && (
                                                    <StatusBadge prId={pr.id} logId={exceptionLog.log.id} status={pr.status as any} notes={exceptionLog.log.notes} canEdit={exceptionLog.log.actorId === session.user.id || session.user.role === 'GA_MANAGER'} />
                                                )}
                                                {stepLogs.length > 0 && (
                                                    <div className="pt-3 pb-1">
                                                        <div className="flex items-center justify-between mb-4"><h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><History className="h-3 w-3" /> Riwayat Aktivitas</h5></div>
                                                        <div className="space-y-5 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-border/60">
                                                            {stepLogs.map(({ log, actor }) => {
                                                                const isRevisionFix = logIsRevisionFix.get(log.id) || (step.index === 5 && logStepMapping.get(log.id) === 4);
                                                                return (
                                                                    <div key={log.id} className="flex gap-3 items-center relative z-10">
                                                                        <Avatar className="h-6 w-6 border bg-background ring-4 ring-background"><AvatarFallback className="text-[9px] font-bold text-primary bg-primary/10">{(actor?.name || 'U').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                                                                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                                                            <div className="flex items-center gap-2 truncate">
                                                                                <p className="text-[13px] leading-relaxed text-foreground/90 truncate"><span className="font-bold">{actor?.name || 'Sistem'}</span> <span className="text-muted-foreground">{isRevisionFix ? 'telah merevisi dokumen' : getActionLabel(log)}</span></p>
                                                                                {isRevisionFix && step.index !== 4 && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-bold text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-900/50 rounded-sm shrink-0"><History className="h-2.5 w-2.5" /> Direvisi</span>}
                                                                            </div>
                                                                            <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-md tabular-nums">{new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
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
                </div>
                <div className="space-y-6">
                    <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-b from-card to-muted/20">
                        <div className="h-1.5 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                        <CardHeader><CardTitle className="text-lg font-bold">Informasi Pengajuan</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {[ 
                                { l: 'Judul Pengajuan', v: pr.title, b: true, i: <FileText className="h-4 w-4" /> }, 
                                { l: 'Total Anggaran', v: formatCurrency(totalAmount), highlighted: true, i: <ReceiptText className="h-4 w-4" /> },
                                { l: 'ID Pengajuan', v: pr.id, m: true, i: <div className="h-4 w-4 flex items-center justify-center text-[10px] font-black border border-current rounded-sm">ID</div> }, 
                                { l: 'Status', component: <div className="pt-1"><PRStatusBadge status={pr.status} /></div>, i: <Clock className="h-4 w-4" /> }, 
                                { l: 'Pemohon', v: requester?.name || requester?.username, i: <User className="h-4 w-4" /> }, 
                                { l: 'Cabang', v: requester?.location || 'Tidak diketahui', i: <MapPin className="h-4 w-4" /> }, 
                                { l: 'Waktu Pengajuan', v: new Date(pr.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }), i: <CalendarDays className="h-4 w-4" /> } 
                            ].map((info, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="mt-1 p-2 rounded-lg bg-muted text-muted-foreground/70 shrink-0">
                                        {info.i}
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{info.l}</p>
                                        {info.component || (
                                            <p className={`text-sm truncate ${
                                                info.highlighted ? 'text-xl font-black text-primary tracking-tight' : 
                                                info.b ? 'font-bold' : 
                                                info.m ? 'font-mono text-[12px] bg-muted/50 px-1.5 py-0.5 rounded' : 
                                                'font-medium'
                                            }`}>
                                                {info.v}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {pr.status === 'COMPLETED' && completionLog && (
                                <div className="flex gap-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                                    <div className="mt-1 p-2 rounded-lg bg-green-500/10 text-green-500 shrink-0">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-green-500/60 uppercase tracking-widest">Selesai Pada</p>
                                        <p className="text-sm font-bold text-green-600 dark:text-green-400">{new Date(completionLog.log.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
