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
import { Card } from '@/components/ui/card';
import { SQL } from 'drizzle-orm';

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <LayoutList className="h-8 w-8 text-primary" />
                        Pengadaan Barang Jasa
                    </h2>
                    <p className="text-muted-foreground">
                        Kelola dan pantau seluruh daftar permohonan pengadaan barang.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <PRFilters />
                    {userRole === 'CABANG' && <AjukanPermohonanDialog />}
                </div>
            </div>

            <Card className="border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold text-foreground px-6 py-4 min-w-[250px]"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> Judul Pengadaan</div></TableHead>
                                <TableHead className="font-semibold text-foreground px-6 py-4 min-w-[150px]"><div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Nama</div></TableHead>
                                <TableHead className="font-semibold text-foreground px-6 py-4 min-w-[150px]"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> Cabang</div></TableHead>
                                <TableHead className="font-semibold text-foreground px-6 py-4 min-w-[180px]">Status</TableHead>
                                <TableHead className="font-semibold text-foreground px-6 py-4 min-w-[180px]"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Waktu Pengajuan</div></TableHead>
                                <TableHead className="text-right px-6 py-4"></TableHead>
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
                                        <TableRow key={pr.id} className="group hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-base group-hover:text-primary transition-colors line-clamp-1">{pr.title}</span>
                                                    <span className="text-xs text-muted-foreground font-normal tracking-tight">ID: {pr.id.split('-')[0].toUpperCase()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                                                        {(requester?.name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium">{requester?.name || 'User'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary/80 text-secondary-foreground text-xs font-medium">
                                                    {requester?.username === 'cabang' ? 'Cabang Utama' : (requester?.username || '-')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <PRStatusBadge status={pr.status} />
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 p-1.5 bg-muted rounded-md shrink-0">
                                                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm font-medium">{dateStr}</span>
                                                        <span className="text-xs text-muted-foreground">{timeStr} WIB</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-6 py-4">
                                                <Link href={`/dashboard/pr/${pr.id}`}>
                                                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary">
                                                        Detail
                                                        <ChevronRight className="ml-1.5 h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
