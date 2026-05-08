import { db } from "@/db";
import { purchaseRequests, approvalLogs, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, CheckCircle2, XCircle, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Dashboard() {
  // Fetch overall statistics
  const totalPrResult = await db.select({ count: sql<number>`count(*)` }).from(purchaseRequests);
  const totalPr = totalPrResult[0].count;

  const statusCounts = await db.select({
    status: purchaseRequests.status,
    count: sql<number>`count(*)`
  }).from(purchaseRequests).groupBy(purchaseRequests.status);

  let pendingStaff = 0;
  let pendingManager = 0;
  let approved = 0;
  let rejected = 0;

  for (const row of statusCounts) {
    const count = Number(row.count);
    if (row.status === 'MENUNGGU_RAB' || row.status === 'MENUNGGU_PR') {
      pendingStaff += count;
    } else if (row.status === 'MENUNGGU_DIVERIFIKASI') {
      pendingManager += count;
    } else if (row.status === 'DITERIMA') {
      approved += count;
    } else if (row.status === 'DITOLAK') {
      rejected += count;
    }
  }

  // Fetch recent activity
  const recentLogs = await db.select({
    log: approvalLogs,
    actor: users,
    pr: purchaseRequests
  })
  .from(approvalLogs)
  .leftJoin(users, eq(approvalLogs.actorId, users.id))
  .leftJoin(purchaseRequests, eq(approvalLogs.prId, purchaseRequests.id))
  .orderBy(desc(approvalLogs.createdAt))
  .limit(5);

  return (
    <div className="space-y-8 p-8 pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">Ringkasan status pengadaan barang dan jasa terkini.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/pr">Lihat Semua Pengajuan</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengajuan</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPr}</div>
            <p className="text-xs text-muted-foreground">Seluruh pengajuan terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu GA Staff</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingStaff}</div>
            <p className="text-xs text-orange-500">Butuh RAB atau PR</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Manager</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingManager}</div>
            <p className="text-xs text-blue-500">Butuh verifikasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai / Diterima</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approved}</div>
            <p className="text-xs text-emerald-500">Pengajuan disetujui</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ringkasan Status</CardTitle>
            <CardDescription>Komposisi status dari semua permohonan pengadaan barang.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-full flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">Menunggu RAB & PR</span>
                    <span className="text-muted-foreground">{(pendingStaff / Math.max(totalPr, 1) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: (pendingStaff / Math.max(totalPr, 1) * 100) + '%' }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-full flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">Menunggu Verifikasi Manager</span>
                    <span className="text-muted-foreground">{(pendingManager / Math.max(totalPr, 1) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: (pendingManager / Math.max(totalPr, 1) * 100) + '%' }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-full flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">Disetujui (Diterima)</span>
                    <span className="text-muted-foreground">{(approved / Math.max(totalPr, 1) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: (approved / Math.max(totalPr, 1) * 100) + '%' }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-full flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">Ditolak</span>
                    <span className="text-muted-foreground">{(rejected / Math.max(totalPr, 1) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: (rejected / Math.max(totalPr, 1) * 100) + '%' }} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Aktivitas Terkini</CardTitle>
            <CardDescription>Log tindakan terbaru di sistem.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentLogs.length > 0 ? recentLogs.map(({ log, actor, pr }) => (
                <div key={log.id} className="flex gap-4">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/20" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {actor?.name || actor?.username} {log.action.toLowerCase() === 'ajukan' ? 'mengajukan permohonan' : 
                       log.action.toLowerCase() === 'diterima' ? 'menerima pengadaan' :
                       log.action.toLowerCase() === 'ditolak' ? 'menolak pengadaan' :
                       'melakukan ' + log.action.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <Link href={'/dashboard/pr/' + pr?.id} className="hover:underline font-medium text-primary">
                        {pr?.title || 'Pengadaan'}
                      </Link>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
