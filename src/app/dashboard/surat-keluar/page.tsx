import { auth } from '@/auth';
import { SuratDialog } from '@/features/surat/components/surat-dialog';
import { getSuratList, deleteSurat } from '@/features/surat/actions';
import { CardedTable } from '@/components/common/carded-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function SuratKeluarPage() {
    const session = await auth();
    if (!session?.user) return null;

    const suratList = await getSuratList('KELUAR');

    return (
        <div className="flex-1 space-y-6 p-0 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
                <div className="space-y-0.5">
                    <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground">Surat Keluar</h2>
                </div>
                <div className="w-full sm:w-auto flex justify-end">
                    <SuratDialog type="KELUAR" />
                </div>
            </div>

            <CardedTable className="mt-2">
                <Table>
                    <TableHeader className="bg-muted/30 border-t border-black/15 dark:border-white/10">
                        <TableRow className="hover:bg-transparent border-b border-black/15 dark:border-white/10">
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground pl-4">Nomor Surat</TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Tanggal</TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Perihal</TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Identifikasi</TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">PIC</TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">File</TableHead>
                            <TableHead className="h-11 pr-4 w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suratList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground h-32">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="p-3 bg-muted/50 rounded-full">
                                            <FileText className="h-6 w-6 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-sm font-medium">Belum ada surat keluar</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            suratList.map((surat) => (
                                <TableRow key={surat.id} className="group transition-colors hover:bg-muted/40 border-b border-black/15 dark:border-white/10 last:border-0">
                                    <TableCell className="pl-4 py-3">
                                        <div className="font-bold text-[13px]">{surat.nomorSurat}</div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="text-[12px]">
                                            {format(new Date(surat.tanggalSurat), 'dd MMMM yyyy', { locale: id })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="text-[13px] max-w-[300px] truncate">{surat.perihal}</div>
                                    </TableCell>
                                    <TableCell className="py-3 hidden md:table-cell">
                                        <div className="text-[12px] text-muted-foreground">{surat.identifikasiName}</div>
                                    </TableCell>
                                    <TableCell className="py-3 hidden lg:table-cell">
                                        <div className="text-[12px]">{surat.picUserName || '-'}</div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        {surat.fileUrl ? (
                                            <a href={surat.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="sm" className="h-8 rounded-full">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </a>
                                        ) : (
                                            <span className="text-[11px] text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="pr-4 py-3 text-right">
                                        <form action={async () => {
                                            'use server';
                                            await deleteSurat(surat.id, 'KELUAR');
                                        }}>
                                            <Button type="submit" variant="ghost" size="sm" className="h-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardedTable>
        </div>
    );
}
