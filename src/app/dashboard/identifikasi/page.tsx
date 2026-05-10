'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { createIdentifikasi, deleteIdentifikasi, getIdentifikasiList } from '@/features/surat/actions';
import { useEffect, useState } from 'react';
import { Identifikasi } from '@/db/schema';
import { CardedTable } from '@/components/common/carded-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const formSchema = z.object({
    name: z.string().min(1, 'Nama harus diisi'),
    code: z.string().min(1, 'Kode harus diisi'),
});

export default function IdentifikasiPage() {
    const [open, setOpen] = useState(false);
    const [list, setList] = useState<Identifikasi[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            code: '',
        },
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const data = await getIdentifikasiList();
        setList(data);
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await createIdentifikasi(values.name, values.code);
            setOpen(false);
            form.reset();
            await loadData();
            toast.success('Identifikasi berhasil ditambahkan');
        } catch (error) {
            toast.error((error as Error).message || 'Gagal menambahkan identifikasi');
        }
    }

    async function handleDelete(id: string) {
        try {
            await deleteIdentifikasi(id);
            await loadData();
            toast.success('Identifikasi berhasil dihapus');
        } catch (error) {
            toast.error((error as Error).message || 'Gagal menghapus identifikasi');
        }
    }

    return (
        <div className="flex-1 space-y-6 p-0 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
                <div className="space-y-0.5">
                    <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground">Identifikasi</h2>
                </div>
                <div className="w-full sm:w-auto flex justify-end">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Identifikasi</DialogTitle>
                                <DialogDescription>
                                    Tambahkan identifikasi baru seperti COO-Kalla Toyota, Staff, dll.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Kode</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Contoh: COO" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nama</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Contoh: Chief Operation Officer" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                            Batal
                                        </Button>
                                        <Button type="submit">
                                            Simpan
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <CardedTable className="mt-2">
                <Table>
                    <TableHeader className="bg-muted/30 border-t border-black/15 dark:border-white/10">
                        <TableRow className="hover:bg-transparent border-b border-black/15 dark:border-white/10">
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground pl-4">Kode</TableHead>
                            <TableHead className="h-11 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Nama</TableHead>
                            <TableHead className="h-11 pr-4 w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground h-32">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <p className="text-sm font-medium">Belum ada data</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            list.map((item) => (
                                <TableRow key={item.id} className="group transition-colors hover:bg-muted/40 border-b border-black/15 dark:border-white/10 last:border-0">
                                    <TableCell className="pl-4 py-3">
                                        <div className="font-bold text-[13px]">{item.code}</div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="text-[13px]">{item.name}</div>
                                    </TableCell>
                                    <TableCell className="pr-4 py-3 text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
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
