'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CardedTable } from '@/components/common/carded-table';
import { Input } from '@/components/ui/input';
import { TablePagination, TableSortHeader } from '@/components/common/table-controls';
import { SuratDeleteButton } from './surat-delete-button';
import Link from 'next/link';

interface SuratItem {
    id: string;
    nomorSurat: string;
    tanggalSurat: Date;
    perihal: string;
    penerima: string | null;
    fileUrl: string | null;
    identifikasiName: string | null;
    kodeSuratName: string | null;
    picUserName: string | null;
}

interface SuratTableProps {
    type: 'MASUK' | 'KELUAR';
    data: SuratItem[];
    totalItems: number;
    currentPage: number;
    pageSize: number;
    q: string | null;
    sort: string;
    order: 'asc' | 'desc';
}

export function SuratTable({ 
    type, 
    data, 
    totalItems, 
    currentPage, 
    pageSize, 
    q, 
    sort, 
    order 
}: SuratTableProps) {
    const getLinkWithParams = (newSort: string, newOrder: 'asc' | 'desc') => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        params.set('page', currentPage.toString());
        params.set('sort', newSort);
        params.set('order', newOrder);
        return `?${params.toString()}`;
    };

    const getSearchLink = (newQ: string) => {
        const params = new URLSearchParams();
        if (newQ) params.set('q', newQ);
        params.set('page', '1');
        params.set('sort', sort);
        params.set('order', order);
        return newQ ? `?${params.toString()}` : '';
    };

    return (
        <CardedTable 
            className="mt-2"
            headerContent={
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari surat..."
                                className="pl-9"
                                defaultValue={q || ''}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        window.location.href = getSearchLink(e.currentTarget.value);
                                    }
                                }}
                            />
                        </div>
                        {q && (
                            <Link href={getSearchLink('')}>
                                <Button variant="ghost" size="sm">Clear</Button>
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Table>
                <TableHeader className="bg-muted/30 border-t border-black/15 dark:border-white/10">
                    <TableRow className="hover:bg-transparent border-b border-black/15 dark:border-white/10">
                        <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground pl-4 min-w-[150px]">
                            <TableSortHeader 
                                label="Nomor Surat" 
                                field="nomorSurat" 
                                currentSort={sort} 
                                currentOrder={order} 
                            />
                        </TableHead>
                        <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[120px]">
                            <TableSortHeader 
                                label="Tanggal" 
                                field="tanggalSurat" 
                                currentSort={sort} 
                                currentOrder={order} 
                            />
                        </TableHead>
                        <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            <TableSortHeader 
                                label="Perihal" 
                                field="perihal" 
                                currentSort={sort} 
                                currentOrder={order} 
                            />
                        </TableHead>
                        <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hidden md:table-cell">
                            <TableSortHeader 
                                label="Identifikasi" 
                                field="identifikasiName" 
                                currentSort={sort} 
                                currentOrder={order} 
                            />
                        </TableHead>
                        <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">
                            <TableSortHeader 
                                label="PIC" 
                                field="picUserName" 
                                currentSort={sort} 
                                currentOrder={order} 
                            />
                        </TableHead>
                        <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">File</TableHead>
                        <TableHead className="h-11 pr-4 w-[60px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground h-32">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="p-3 bg-muted/50 rounded-full">
                                        <FileText className="h-6 w-6 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-sm font-medium">Belum ada surat {type === 'MASUK' ? 'masuk' : 'keluar'}</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((surat) => (
                            <TableRow key={surat.id} className="group transition-all duration-200 hover:bg-muted/50 hover:shadow-sm border-b border-black/10 dark:border-white/10 last:border-0">
                                <TableCell className="pl-4 py-3.5">
                                    <div className="font-bold text-[13px] group-hover:text-primary transition-colors">{surat.nomorSurat}</div>
                                </TableCell>
                                <TableCell className="py-3.5">
                                    <div className="text-[12px] font-medium text-foreground">
                                        {format(new Date(surat.tanggalSurat), 'dd MMMM yyyy', { locale: id })}
                                    </div>
                                </TableCell>
                                <TableCell className="py-3.5">
                                    <div className="text-[13px] max-w-[300px] truncate group-hover:text-foreground transition-colors">{surat.perihal}</div>
                                </TableCell>
                                <TableCell className="py-3.5 hidden md:table-cell">
                                    <div className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">{surat.identifikasiName || '-'}</div>
                                </TableCell>
                                <TableCell className="py-3.5 hidden lg:table-cell">
                                    <div className="text-[12px]">{surat.picUserName || '-'}</div>
                                </TableCell>
                                <TableCell className="py-3.5">
                                    {surat.fileUrl ? (
                                        <div className="flex gap-1.5">
                                            <a href={surat.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all" title="Lihat File">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </a>
                                            <a href={surat.fileUrl} target="_blank" rel="noopener noreferrer" download>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all" title="Download File">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </a>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="pr-4 py-3.5 text-right">
                                    <SuratDeleteButton suratId={surat.id} nomorSurat={surat.nomorSurat} type={type} />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <div className="px-2 pb-8 mt-6">
                <TablePagination totalItems={totalItems} pageSize={pageSize} currentPage={currentPage} />
            </div>
        </CardedTable>
    );
}
