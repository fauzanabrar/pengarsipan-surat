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
import { TablePagination, TableSortHeader } from '@/components/common/table-controls';
import { asc } from 'drizzle-orm';

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
    const view = typeof v === 'string' ? v : 'all'; // 'todo' or 'all'

    const page = Number(resolvedSearchParams.page) || 1;
    const pageSize = 10;
    const sort = typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : 'createdAt';
    const order = typeof resolvedSearchParams.order === 'string' ? resolvedSearchParams.order as 'asc' | 'desc' : 'desc';

    // Determine common access conditions
    const visibility = getVisibilityConditions(userId, userRole);
    const actionRequired = getActionRequiredConditions(userId, userRole);
    const ownRequests = eq(purchaseRequests.requesterId, userId);

    // 1. Where Filters (for the main table, depends on 'view' tab)
    const whereFilters: (SQL | undefined)[] = [];
    if (view === 'mine') {
        whereFilters.push(ownRequests);
    } else if (view === 'todo') {
        if (actionRequired) whereFilters.push(actionRequired);
    } else {
        if (visibility) whereFilters.push(visibility);
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

    // 2. Count Filters (for the "Perlu Diproses" badge, always acts like view='todo')
    const countFilters: (SQL | undefined)[] = [];
    if (actionRequired) countFilters.push(actionRequired);

    const [todoCountResult] = await db.select({ total: count() })
        .from(purchaseRequests)
        .where(and(...countFilters.filter((f): f is SQL => !!f)));
    
    const todoCount = todoCountResult.total;

    // Total count for current filters (for pagination)
    const [totalCountResult] = await db.select({ total: count() })
        .from(purchaseRequests)
        .leftJoin(users, eq(purchaseRequests.requesterId, users.id))
        .where(and(...whereFilters));
    
    const totalItems = totalCountResult.total;

    // Determine order
    const sortFieldMap: Record<string, any> = {
        title: purchaseRequests.title,
        name: users.name,
        location: users.location,
        status: purchaseRequests.status,
        createdAt: purchaseRequests.createdAt,
    };

    const sortField = sortFieldMap[sort] || purchaseRequests.createdAt;
    const orderFn = order === 'asc' ? asc : desc;

    const prs = await db.select({
        pr: purchaseRequests,
        requester: users,
    })
        .from(purchaseRequests)
        .leftJoin(users, eq(purchaseRequests.requesterId, users.id))
        .where(and(...whereFilters))
        .orderBy(orderFn(sortField))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    const getLinkWithParams = (newView: string) => {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (statusFilter) params.set('status', statusFilter);
        params.set('view', newView);
        return `?${params.toString()}`;
    };

        return (
        <div className="flex-1 space-y-6 p-0 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
                <div className="space-y-0.5">
                    <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground">Pengadaan Barang Jasa</h2>
                </div>
                {(userRole === 'CABANG' || userRole === 'GA_STAFF') && (
                    <div className="w-full sm:w-auto flex justify-end">
                        <AjukanPermohonanDialog />
                    </div>
                )}
            </div>

            <CardedTable
                className="mt-2"
                headerContent={
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full">
                        <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border w-full sm:w-auto overflow-x-auto no-scrollbar">
                            <Link 
                                href={getLinkWithParams('all')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all whitespace-nowrap ${view === 'all' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <History className="h-3.5 w-3.5" />
                                <span>Semua</span>
                            </Link>
                            <Link 
                                href={getLinkWithParams('mine')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all whitespace-nowrap ${view === 'mine' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <User className="h-3.5 w-3.5" />
                                <span>Pengajuan Saya</span>
                            </Link>
                            <Link 
                                href={getLinkWithParams('todo')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all whitespace-nowrap ${view === 'todo' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
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
                                <TableSortHeader label="Judul" field="title" currentSort={sort} currentOrder={order} icon={<FileText className="h-3.5 w-3.5" />} />
                            </TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[140px]">
                                <TableSortHeader label="Pemohon" field="name" currentSort={sort} currentOrder={order} icon={<User className="h-3.5 w-3.5" />} />
                            </TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[110px]">
                                <TableSortHeader label="Cabang" field="location" currentSort={sort} currentOrder={order} icon={<MapPin className="h-3.5 w-3.5" />} />
                            </TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[130px]">
                                <TableSortHeader label="Status" field="status" currentSort={sort} currentOrder={order} />
                            </TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[140px]">
                                <TableSortHeader label="Waktu" field="createdAt" currentSort={sort} currentOrder={order} icon={<Clock className="h-3.5 w-3.5" />} />
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
                                                <Link href={`/dashboard/pr/${pr.id}`} className="font-bold text-[14px] group-hover:text-primary hover:underline transition-colors line-clamp-1">
                                                    {pr.title}
                                                </Link>
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
                                                    {requester?.location || (requester?.role === 'GA_STAFF' ? 'Head Office' : (requester?.username === 'cabang' ? 'Utama' : (requester?.username || '-')))}
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

            <div className="px-2 pb-8">
                <TablePagination totalItems={totalItems} pageSize={pageSize} currentPage={page} />
            </div>
        </div>
    );
}
