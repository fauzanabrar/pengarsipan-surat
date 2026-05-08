import { db } from '@/db';
import { purchaseRequests, users } from '@/db/schema';
import { auth } from '@/auth';
import { eq, desc, or } from 'drizzle-orm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PRStatusBadge } from '@/features/pr/components/status-badge';
import { getRoleBasedQueueConditions } from '@/features/pr/utils';
import { AjukanPermohonanDialog } from '@/features/pr/components/ajukan-permohonan-dialog';
import { PRFilters } from '@/features/pr/components/pr-filters';
import { and, ilike } from 'drizzle-orm';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { FileText, MapPin, User, Clock, ChevronRight, LayoutList, CalendarDays } from 'lucide-react';
import { SQL } from 'drizzle-orm';
import { CardedTable } from '@/components/common/carded-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

    const conditions = getRoleBasedQueueConditions(userId, userRole);
    
    // Parse search parameters
    const resolvedSearchParams = await searchParams;
    const q = resolvedSearchParams.q;
    const query = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : null;
    
    const s = resolvedSearchParams.status;
    const statusFilter = typeof s === 'string' ? s : Array.isArray(s) ? s[0] : null;

    const whereFilters: (SQL | undefined)[] = [conditions];

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

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto w-full">
            <CardedTable
                title="Pengadaan Barang Jasa"
                headerContent={
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <PRFilters />
                        {userRole === 'CABANG' && <AjukanPermohonanDialog />}
                    </div>
                }
            >
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-b border-black/5 dark:border-white/5">
                            <TableHead className="h-14 text-xs font-bold uppercase tracking-widest text-muted-foreground pl-6 min-w-[200px]">
                                <div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Judul</div>
                            </TableHead>
                            <TableHead className="h-14 text-xs font-bold uppercase tracking-widest text-muted-foreground min-w-[150px]">
                                <div className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Pengaju</div>
                            </TableHead>
                            <TableHead className="h-14 text-xs font-bold uppercase tracking-widest text-muted-foreground min-w-[120px]">
                                <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Cabang</div>
                            </TableHead>
                            <TableHead className="h-14 text-xs font-bold uppercase tracking-widest text-muted-foreground min-w-[140px]">Status</TableHead>
                            <TableHead className="h-14 text-xs font-bold uppercase tracking-widest text-muted-foreground min-w-[160px]">
                                <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Waktu</div>
                            </TableHead>
                            <TableHead className="h-14 pr-6 w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {prs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground h-48">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="p-4 bg-muted/50 rounded-full">
                                            <FileText className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-base font-medium">Belum ada data permohonan</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            prs.map(({ pr, requester }) => {
                                const dateObj = new Date(pr.createdAt);
                                const dateStr = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                                const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <TableRow key={pr.id} className="group transition-colors hover:bg-muted/40 border-b border-black/5 dark:border-white/5 last:border-0">
                                        <TableCell className="pl-6 py-5">
                                            <div className="flex flex-col gap-1 overflow-hidden">
                                                <span className="font-bold text-[14px] group-hover:text-primary transition-colors line-clamp-1">{pr.title}</span>
                                                <span className="text-[10px] font-medium text-muted-foreground tracking-tight">ID: {pr.id.split('-')[0].toUpperCase()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8 border-2 border-primary/10 shadow-sm shrink-0">
                                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-[10px]">
                                                        {(requester?.name || 'U').charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="font-bold text-[13px] truncate">{requester?.name || 'User'}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate">@{requester?.username}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex items-center">
                                                <span className="px-2 py-0.5 rounded-full bg-muted/50 border text-[11px] font-medium text-muted-foreground">
                                                    {requester?.username === 'cabang' ? 'Cabang Utama' : (requester?.username || '-')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <PRStatusBadge status={pr.status} />
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex items-start gap-2">
                                                <div className="mt-0.5 p-1 bg-muted rounded-sm shrink-0">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                                <div className="flex flex-col gap-0">
                                                    <span className="text-[12px] font-bold text-foreground/80">{dateStr}</span>
                                                    <span className="text-[10px] font-medium text-muted-foreground">{timeStr} WIB</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-6 py-5 text-right">
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
