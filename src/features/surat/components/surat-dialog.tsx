'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { createSurat, getIdentifikasiList, getKodeSuratList, getUsersList } from '../actions';
import { useEffect, useState } from 'react';
import { Identifikasi, KodeSurat, User } from '@/db/schema';
import { FileUploader } from '@/components/common/file-uploader';
import { toast } from 'sonner';

const formSchema = z.object({
    tanggalSurat: z.date(),
    identifikasiId: z.string().min(1, 'Identifikasi harus dipilih'),
    kodeSuratId: z.string().min(1, 'Kode Surat harus dipilih'),
    perihal: z.string().min(1, 'Perihal harus diisi'),
    tujuan: z.string().optional(),
    penerima: z.string().optional(),
    picUserId: z.string().optional(),
    fileUrl: z.string().optional(),
});

interface SuratDialogProps {
    type: 'MASUK' | 'KELUAR';
}

export function SuratDialog({ type }: SuratDialogProps) {
    const [open, setOpen] = useState(false);
    const [identifikasiList, setIdentifikasiList] = useState<Identifikasi[]>([]);
    const [kodeSuratList, setKodeSuratList] = useState<KodeSurat[]>([]);
    const [usersList, setUsersList] = useState<User[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tanggalSurat: new Date(),
            perihal: '',
            tujuan: '',
            penerima: '',
        },
    });

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    async function loadData() {
        const [identifikasi, kodeSurat, users] = await Promise.all([
            getIdentifikasiList(),
            getKodeSuratList(),
            getUsersList(),
        ]);
        setIdentifikasiList(identifikasi);
        setKodeSuratList(kodeSurat);
        setUsersList(users);
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await createSurat({
                type,
                ...values,
            });
            setOpen(false);
            form.reset();
            toast.success('Surat berhasil ditambahkan');
        } catch (error) {
            toast.error((error as Error).message || 'Gagal menambahkan surat');
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Surat
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Tambah {type === 'MASUK' ? 'Surat Masuk' : 'Surat Keluar'}</DialogTitle>
                    <DialogDescription>
                        Isi detail surat di bawah ini. Nomor surat akan di-generate otomatis.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tanggalSurat"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tanggal Surat</FormLabel>
                                        <FormControl>
                                            <DatePicker date={field.value} setDate={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="identifikasiId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Identifikasi</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih identifikasi" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {identifikasiList.map((item) => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.code} - {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="kodeSuratId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kode Surat</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih kode surat" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {kodeSuratList.map((item) => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.code} - {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="picUserId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>PIC</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih PIC" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {usersList.map((user) => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.name || user.username}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="perihal"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Perihal</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Masukkan perihal surat" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tujuan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tujuan</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Masukkan tujuan surat" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="penerima"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Penerima</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Masukkan penerima surat" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fileUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>File Surat (PDF)</FormLabel>
                                    <FormControl>
                                        <FileUploader 
                                            onFileUploaded={(url) => field.onChange(url)} 
                                            accept=".pdf"
                                        />
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
    );
}
