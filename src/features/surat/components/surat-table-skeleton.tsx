import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export function SuratTableSkeleton() {
    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-[40px] text-center h-10"><Skeleton className="h-3 w-4 mx-auto" /></TableHead>
                        <TableHead className="w-[100px] h-10"><Skeleton className="h-3 w-16" /></TableHead>
                        <TableHead className="hidden sm:table-cell w-[100px] h-10"><Skeleton className="h-3 w-16" /></TableHead>
                        <TableHead className="min-w-[120px] h-10"><Skeleton className="h-3 w-24" /></TableHead>
                        <TableHead className="hidden md:table-cell w-[100px] h-10"><Skeleton className="h-3 w-16" /></TableHead>
                        <TableHead className="hidden lg:table-cell w-[100px] h-10"><Skeleton className="h-3 w-16" /></TableHead>
                        <TableHead className="hidden lg:table-cell w-[100px] h-10"><Skeleton className="h-3 w-12" /></TableHead>
                        <TableHead className="pl-4 w-[110px] h-10"><Skeleton className="h-3 w-20" /></TableHead>
                        <TableHead className="w-[50px] h-10"><Skeleton className="h-3 w-8 mx-auto" /></TableHead>
                        <TableHead className="w-[80px] h-10"><Skeleton className="h-3 w-10 mx-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell className="text-center py-3"><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell className="hidden sm:table-cell py-3"><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell className="hidden md:table-cell py-3"><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell className="hidden lg:table-cell py-3"><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell className="hidden lg:table-cell py-3"><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell className="pl-4 py-3"><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-8 w-8 mx-auto rounded-md" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-8 w-16 mx-auto rounded-md" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
