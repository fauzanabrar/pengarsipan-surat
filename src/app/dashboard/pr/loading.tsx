import { Skeleton } from "@/components/ui/skeleton";
import { CardedTable } from "@/components/common/carded-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export default function PRLoading() {
    return (
        <div className="flex-1 space-y-6 p-0 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
            {/* Header Area Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
                <div className="space-y-0.5">
                    <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground">Pengadaan Barang Jasa</h2>
                </div>
                <div className="w-full sm:w-auto flex justify-end">
                    <Skeleton className="h-9 w-40 rounded-md" />
                </div>
            </div>

            {/* Table Area Skeleton */}
            <CardedTable
                className="mt-2"
                headerContent={
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full">
                        {/* Tabs Skeleton */}
                        <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border w-full sm:w-auto overflow-x-auto no-scrollbar">
                            <Skeleton className="h-8 w-24 rounded-md" />
                            <Skeleton className="h-8 w-32 rounded-md" />
                            <Skeleton className="h-8 w-32 rounded-md" />
                        </div>
                        {/* Filter Skeleton */}
                        <div className="w-full sm:w-auto flex justify-end">
                            <Skeleton className="h-8 w-[200px] sm:w-64 rounded-md" />
                        </div>
                    </div>
                }
            >
                <PRTableSkeleton />
            </CardedTable>
        </div>
    );
}

export function PRTableSkeleton() {
    return (
        <>
                <Table>
                    <TableHeader className="bg-muted/30 border-t border-black/15 dark:border-white/10">
                        <TableRow className="hover:bg-transparent border-b border-black/15 dark:border-white/10">
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground pl-4 min-w-[120px]">
                                <Skeleton className="h-4 w-16" />
                            </TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[120px]">
                                <Skeleton className="h-4 w-20" />
                            </TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[100px] hidden md:table-cell">
                                <Skeleton className="h-4 w-16" />
                            </TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[90px]">
                                <Skeleton className="h-4 w-16" />
                            </TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[120px] hidden lg:table-cell">
                                <Skeleton className="h-4 w-16" />
                            </TableHead>
                            <TableHead className="h-11 pr-4 w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i} className="hover:bg-transparent border-b border-black/15 dark:border-white/10 last:border-0">
                                {/* Judul */}
                                <TableCell className="pl-4 py-3">
                                    <div className="flex flex-col gap-1.5">
                                        <Skeleton className="h-4 w-3/4 max-w-[200px]" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </TableCell>
                                {/* Pemohon */}
                                <TableCell className="py-3">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                        <div className="flex flex-col gap-1.5 w-full">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                </TableCell>
                                {/* Cabang */}
                                <TableCell className="py-3 hidden md:table-cell">
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                </TableCell>
                                {/* Status */}
                                <TableCell className="py-3 scale-[0.9] origin-left">
                                    <Skeleton className="h-6 w-24 rounded-full" />
                                </TableCell>
                                {/* Waktu */}
                                <TableCell className="py-3 hidden lg:table-cell">
                                    <div className="flex items-start gap-2">
                                        <Skeleton className="mt-0.5 h-4 w-4 rounded-sm shrink-0" />
                                        <div className="flex flex-col gap-1.5">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-3 w-12" />
                                        </div>
                                    </div>
                                </TableCell>
                                {/* Action */}
                                <TableCell className="pr-4 py-3 text-right">
                                    <Skeleton className="h-8 w-16 rounded-full ml-auto" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

            {/* Pagination Skeleton */}
            <div className="px-2 pb-8 mt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center gap-1.5">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                </div>
            </div>
        </>
    );
}
