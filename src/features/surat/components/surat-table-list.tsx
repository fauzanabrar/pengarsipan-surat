import { getSuratList } from "@/features/surat/actions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit2, FileText } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { SuratDialog } from "./surat-dialog";
import { SuratDeleteButton } from "./surat-delete-button";
import { TablePagination, TableSortHeader } from "@/components/common/table-controls";
import { CardedTable } from "@/components/common/carded-table";
import { SuratSearch } from "@/components/common/surat-search";

interface SuratTableListProps {
    type: 'MASUK' | 'KELUAR';
    searchParams: { [key: string]: string | string[] | undefined };
}

export async function SuratTableList({ type, searchParams }: SuratTableListProps) {
    const q = searchParams.q;
    const query = typeof q === 'string' ? q : null;
    
    const page = Number(searchParams.page) || 1;
    const pageSize = 10;
    const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'tanggalSurat';
    const order = typeof searchParams.order === 'string' 
        ? (searchParams.order as 'asc' | 'desc') 
        : 'desc';

    const { data: suratList, total } = await getSuratList(type, {
        q: query || undefined,
        page,
        pageSize,
        sort,
        order,
    });

    return (
        <CardedTable 
            className="mt-1"
            headerContent={
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full">
                    <SuratSearch q={query} sort={sort} order={order} />
                </div>
            }
        >
            <Table className="table-fixed w-full">
                <TableHeader className="bg-muted/30 border-y border-black/10 dark:border-white/10">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-[80px] pl-4">
                            <TableSortHeader 
                                label="Tanggal" 
                                field="tanggalSurat" 
                                currentSort={sort} 
                                currentOrder={order} 
                            />
                        </TableHead>
                        <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell w-[100px]">
                            <TableSortHeader 
                                label="Identifikasi" 
                                field="identifikasiName" 
                                currentSort={sort} 
                                currentOrder={order} 
                            />
                        </TableHead>

                        <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-muted-foreground min-w-[120px]">
                            <TableSortHeader 
                                label="Perihal" 
                                field="perihal" 
                                currentSort={sort} 
                                currentOrder={order} 
                            />
                        </TableHead>
                        <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell w-[100px]">
                            <TableSortHeader 
                                label="Tujuan" 
                                field="tujuan" 
                                currentSort={sort} 
                                currentOrder={order} 
                            />
                        </TableHead>
                        <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell w-[100px]">
                            <TableSortHeader 
                                label="Penerima" 
                                field="penerima" 
                                currentSort={sort} 
                                currentOrder={order} 
                            />
                        </TableHead>
                        <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell w-[100px]">
                            <TableSortHeader 
                                label="PIC" 
                                field="picUserName" 
                                currentSort={sort} 
                                currentOrder={order} 
                            />
                        </TableHead>
                        <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-4 w-[110px]">
                            <TableSortHeader 
                                label="Nomor Surat" 
                                field="nomorSurat" 
                                currentSort={sort} 
                                currentOrder={order} 
                            />
                        </TableHead>
                        <TableHead className="h-9 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-[50px] px-2 text-center">File</TableHead>
                        <TableHead className="h-9 w-[80px] text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {suratList.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground h-24">
                                <div className="flex flex-col items-center justify-center gap-1.5">
                                    <div className="p-2.5 bg-muted/50 rounded-full">
                                        <FileText className="h-5 w-5 text-muted-foreground/40" />
                                    </div>
                                    <p className="text-xs font-medium">Belum ada surat {type.toLowerCase()}</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        suratList.map((surat) => (
                            <TableRow key={surat.id} className="group transition-all duration-200 hover:bg-muted/30 border-b border-black/5 dark:border-white/5 last:border-0">
                                <TableCell className="py-2.5 pl-4">
                                    <div className="text-[11px] font-medium text-foreground leading-relaxed">
                                        {format(new Date(surat.tanggalSurat), 'dd MMM yyyy', { locale: id })}
                                    </div>
                                </TableCell>
                                <TableCell className="py-2.5 hidden sm:table-cell">
                                    <div className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors truncate" title={surat.identifikasiName || ''}>
                                        {surat.identifikasiName || '-'}
                                    </div>
                                </TableCell>

                                <TableCell className="py-2.5 align-top max-w-xs">
                                    <div className="text-[12px] font-medium group-hover:text-foreground transition-colors leading-relaxed break-words whitespace-normal" title={surat.perihal}>
                                        {surat.perihal}
                                    </div>
                                </TableCell>
                                <TableCell className="py-2.5 hidden md:table-cell align-top max-w-xs">
                                    <div className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors break-words whitespace-normal" title={surat.tujuan || ''}>
                                        {surat.tujuan || '-'}
                                    </div>
                                </TableCell>
                                <TableCell className="py-2.5 hidden lg:table-cell align-top max-w-xs">
                                    <div className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors break-words whitespace-normal" title={surat.penerima || ''}>
                                        {surat.penerima || '-'}
                                    </div>
                                </TableCell>
                                <TableCell className="py-2.5 hidden lg:table-cell">
                                    <div className="text-[11px] font-medium">{surat.picUserName || '-'}</div>
                                </TableCell>
                                <TableCell className="pl-4 py-2.5 align-top max-w-xs">
                                    <div className="font-bold text-[12px] tracking-tight group-hover:text-primary transition-colors break-words whitespace-normal" title={surat.nomorSurat}>
                                        {surat.nomorSurat}
                                    </div>
                                </TableCell>
                                <TableCell className="py-2.5 px-2 text-center">
                                    {surat.fileUrl ? (
                                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <a href={surat.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all" title="Lihat">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </a>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground/30 italic">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="py-2.5 px-2 text-center">
                                    <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <SuratDialog 
                                            type={type} 
                                            id={surat.id}
                                            initialData={{
                                                tanggalSurat: surat.tanggalSurat,
                                                identifikasiId: surat.identifikasiId,
                                                kodeSuratId: surat.kodeSuratId,
                                                perihal: surat.perihal,
                                                tujuan: surat.tujuan || '',
                                                penerima: surat.penerima || '',
                                                picUserId: surat.picUserId || '',
                                                fileUrl: surat.fileUrl || '',
                                            }}
                                            trigger={
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all">
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                            }
                                        />
                                        <SuratDeleteButton suratId={surat.id} nomorSurat={surat.nomorSurat} type={type} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    ))}
                </TableBody>
            </Table>

            <div className="px-4 pb-6 mt-4">
                <TablePagination 
                    totalItems={total} 
                    pageSize={pageSize} 
                    currentPage={page} 
                />
            </div>
        </CardedTable>
    );
}
