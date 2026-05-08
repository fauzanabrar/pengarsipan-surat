import { db } from '@/db';
import { purchaseRequests, users } from '@/db/schema';
import { auth } from '@/auth';
import { eq, desc, or } from 'drizzle-orm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PRStatusBadge } from '@/features/pr/components/status-badge';
import { getVisibilityConditions, getActionRequiredConditions } from '@/features/pr/utils';
import { AjukanPermohonanDialog } from '@/features/pr/components/ajukan-permohonan-dialog';
import { PRFilters } from '@/features/pr/components/pr-filters';
import { and, ilike, count } from 'drizzle-orm';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { FileText, MapPin, User, Clock, ChevronRight, LayoutList, CalendarDays, Inbox, History } from 'lucide-react';
import { SQL } from 'drizzle-orm';
import { CardedTable } from '@/components/common/carded-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const dynamic = 'force-dynamic';

export default async function PRQueuePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    if (!session?.user) return null;

    const userRole = session.user.role;
    const userId = session.user.id;

    if (!userId) {
        return <div className="p-8">Error: User ID is missing from session. Please log out and log back in.</div>;
    }

    // Parse search parameters
    const resolvedSearchParams = await searchParams;
    const q = resolvedSearchParams.q;
    const query = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : null;
    
    const s = resolvedSearchParams.status;
    const statusFilter = typeof s === 'string' ? s : Array.isArray(s) ? s[0] : null;

    const v = resolvedSearchParams.view;
    const view = typeof v === 'string' ? v : 'todo'; // 'todo' or 'all'

    // Determine conditions based on view
    const visibility = getVisibilityConditions(userId, userRole);
    const actionRequired = getActionRequiredConditions(userId, userRole);

    const whereFilters: (SQL | undefined)[] = [];
    
    // Visibility filter (role-based access)
    if (visibility) whereFilters.push(visibility);

    // View filter (Inbox vs History)
    if (view === 'todo' && actionRequired) {
        whereFilters.push(actionRequired);
    }

    if (query) {
        whereFilters.push(or(
            ilike(purchaseRequests.title, `%${query}%`),
            ilike(users.name, `%${query}%`),
            ilike(users.username, `%${query}%`)
        ));
    }

    if (statusFilter) {
        whereFilters.push(eq(purchaseRequests.status, statusFilter as any));
    }

    const prs = await db.select({
        pr: purchaseRequests,
        requester: users,
    })
        .from(purchaseRequests)
        .leftJoin(users, eq(purchaseRequests.requesterId, users.id))
        .where(and(...whereFilters))
        .orderBy(desc(purchaseRequests.createdAt));

    // Count for badge (only for "todo" view)
    const countFilters: SQL[] = [];
    if (visibility) countFilters.push(visibility);
    if (actionRequired) countFilters.push(actionRequired);

    const [todoCountResult] = await db.select({ total: count() })
        .from(purchaseRequests)
        .where(and(...countFilters));
    
    const todoCount = todoCountResult.total;

    const getLinkWithParams = (newView: string) => {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (statusFilter) params.set('status', statusFilter);
        params.set('view', newView);
        return `?${params.toString()}`;
    };

    return (
        <div className="flex-1 space-y-2 p-0 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                <div className="space-y-0.5">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Pengadaan Barang Jasa</h2>
                    
                </div>
                {userRole === 'CABANG' && <AjukanPermohonanDialog />}
            </div>

            <CardedTable
                className="mt-8"
                headerContent={
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                        <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border w-full sm:w-auto">
                            <Link 
                                href={getLinkWithParams('todo')}
                                className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold transition-all ${view === 'todo' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Inbox className="h-3.5 w-3.5" />
                                <span className="hidden xs:inline">Perlu Diproses</span>
                                <span className="xs:hidden">Perlu Diproses</span>
                                {todoCount > 0 && (
                                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground font-black ml-0.5">
                                        {todoCount}
                                    </span>
                                )}
                            </Link>
                            <Link 
                                href={getLinkWithParams('all')}
                                className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold transition-all ${view === 'all' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <History className="h-3.5 w-3.5" />
                                <span>Semua</span>
                            </Link>
                        </div>
                        <div className="w-full sm:w-auto flex justify-end">
                            <PRFilters />
                        </div>
                    </div>
                }
            >
                <Table>
                    <TableHeader className="bg-muted/30 border-t border-black/15 dark:border-white/10">
                        <TableRow className="hover:bg-transparent border-b border-black/15 dark:border-white/10">
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground pl-4 min-w-[180px]">
                                <div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Judul</div>
                            </TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[140px]">
                                <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Pengaju</div>
                            </TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[110px]">
                                <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Cabang</div>
                            </TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[130px]">Status</TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[140px]">
                                <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Waktu</div>
                            </TableHead>
                            <TableHead className="h-11 pr-4 w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {prs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="p-3 bg-muted/50 rounded-full">
                                            <FileText className="h-6 w-6 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-sm font-medium">Belum ada data</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            prs.map(({ pr, requester }) => {
                                const dateObj = new Date(pr.createdAt);
                                const dateStr = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
                                const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <TableRow key={pr.id} className="group transition-colors hover:bg-muted/40 border-b border-black/15 dark:border-white/10 last:border-0">
                                        <TableCell className="pl-4 py-3">
                                            <div className="flex flex-col gap-0.5 overflow-hidden">
                                                <span className="font-bold text-[14px] group-hover:text-primary transition-colors line-clamp-1">{pr.title}</span>
                                                <span className="text-[10px] font-medium text-muted-foreground tracking-tight">ID: {pr.id.split('-')[0].toUpperCase()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8 border-2 border-primary/10 shadow-sm shrink-0">
                                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-[10px]">
                                                        {(requester?.name || 'U').charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="font-bold text-[13px] truncate leading-tight">{requester?.name || 'User'}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate">@{requester?.username}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-center">
                                                <span className="px-2 py-0.5 rounded-full bg-muted/50 border text-[11px] font-medium text-muted-foreground">
                                                    {requester?.username === 'cabang' ? 'Utama' : (requester?.username || '-')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 scale-[0.9] origin-left">
                                            <PRStatusBadge status={pr.status} />
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-start gap-2">
                                                <div className="mt-0.5 p-0.5 bg-muted rounded-sm shrink-0">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                                <div className="flex flex-col gap-0">
                                                    <span className="text-[12px] font-bold text-foreground/80 leading-none">{dateStr}</span>
                                                    <span className="text-[10px] font-medium text-muted-foreground">{timeStr}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-4 py-3 text-right">
                                            <Link href={`/dashboard/pr/${pr.id}`}>
                                                <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 transition-all hover:bg-primary/10 hover:text-primary font-bold text-[10px] uppercase tracking-wider">
                                                    Detail
                                                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </CardedTable>
        </div>
    );
}
