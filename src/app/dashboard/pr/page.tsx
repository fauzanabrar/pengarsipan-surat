import { db } from '@/db';
import { purchaseRequests, users } from '@/db/schema';
import { auth } from '@/auth';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PRStatusBadge } from '@/features/pr/components/status-badge';
import { getRoleBasedQueueConditions } from '@/features/pr/utils';
import { AjukanPermohonanDialog } from '@/features/pr/components/ajukan-permohonan-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export default async function PRQueuePage() {
    const session = await auth();
    if (!session?.user) return null;

    const userRole = session.user.role;
    const userId = session.user.id;

    if (!userId) {
        return <div className="p-8">Error: User ID is missing from session. Please log out and log back in.</div>;
    }

    const conditions = getRoleBasedQueueConditions(userId, userRole);

    const prs = await db.select({
        pr: purchaseRequests,
        requester: users,
    })
        .from(purchaseRequests)
        .leftJoin(users, eq(purchaseRequests.requesterId, users.id))
        .where(conditions)
        .orderBy(desc(purchaseRequests.createdAt));

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Pengadaan Barang Jasa</h2>
                <div className="flex items-center space-x-2">
                    {userRole === 'CABANG' && <AjukanPermohonanDialog />}
                </div>
            </div>

            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Judul Pengadaan</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>Cabang</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Waktu Pengajuan</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {prs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                                    Belum ada data permohonan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            prs.map(({ pr, requester }) => {
                                const dateObj = new Date(pr.createdAt);
                                const dateStr = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                                const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <TableRow key={pr.id}>
                                        <TableCell className="font-medium">{pr.title}</TableCell>
                                        <TableCell>{requester?.name || 'User'}</TableCell>
                                        <TableCell className="text-muted-foreground">{requester?.username === 'cabang' ? 'Cabang Utama' : (requester?.username || '-')}</TableCell>
                                        <TableCell><PRStatusBadge status={pr.status} /></TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{dateStr}</span>
                                                <span className="text-xs text-muted-foreground">{timeStr}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/dashboard/pr/${pr.id}`}>
                                                <Button variant="outline" size="sm">
                                                    Detail
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
        </div>
    );
}
