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
import { Plus, Edit2 } from 'lucide-react';
import { createSurat, getIdentifikasiList, getKodeSuratList, getUsersList, updateSurat } from '../actions';
import { useEffect, useState, ReactNode } from 'react';
import { Identifikasi, KodeSurat, User } from '@/db/schema';
import { toast } from 'sonner';
import { UniversalUploader } from '@/components/universal-uploader';

const formSchema = z.object({
    tanggalSurat: z.date(),
    identifikasiId: z.string().min(1, 'Identifikasi harus dipilih'),
    kodeSuratId: z.string().min(1, 'Kode Surat harus dipilih'),
    perihal: z.string().min(1, 'Perihal harus diisi'),
    tujuan: z.string().optional(),
    penerima: z.string().optional(),
    picUserId: z.string().optional(),
});

interface SuratDialogProps {
    type: 'MASUK' | 'KELUAR';
    id?: string;
    initialData?: {
        tanggalSurat: Date;
        identifikasiId: string;
        kodeSuratId: string;
        perihal: string;
        tujuan?: string;
        penerima?: string;
        picUserId?: string;
        fileUrl?: string;
    };
    trigger?: ReactNode;
}

export function SuratDialog({ type, id, initialData, trigger }: SuratDialogProps) {
    const [open, setOpen] = useState(false);
    const [identifikasiList, setIdentifikasiList] = useState<Identifikasi[]>([]);
    const [kodeSuratList, setKodeSuratList] = useState<KodeSurat[]>([]);
    const [usersList, setUsersList] = useState<User[]>([]);
    const [uploadMode, setUploadMode] = useState<'file' | 'url'>(initialData?.fileUrl ? 'url' : 'file');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState(initialData?.fileUrl || '');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tanggalSurat: initialData?.tanggalSurat || new Date(),
            identifikasiId: initialData?.identifikasiId || '',
            kodeSuratId: initialData?.kodeSuratId || '',
            perihal: initialData?.perihal || '',
            tujuan: initialData?.tujuan || '',
            penerima: initialData?.penerima || '',
            picUserId: initialData?.picUserId || '',
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
            const formData = new FormData();
            formData.append('type', type);
            formData.append('tanggalSurat', values.tanggalSurat.toISOString());
            formData.append('identifikasiId', values.identifikasiId);
            formData.append('kodeSuratId', values.kodeSuratId);
            formData.append('perihal', values.perihal);
            if (values.tujuan) formData.append('tujuan', values.tujuan);
            if (values.penerima) formData.append('penerima', values.penerima);
            if (values.picUserId) formData.append('picUserId', values.picUserId);
            
            if (selectedFile) {
                formData.append('file', selectedFile);
            } else if (fileUrl) {
                formData.append('fileUrl', fileUrl);
            }

            if (id) {
                await updateSurat(id, formData);
                toast.success('Surat berhasil diperbarui');
            } else {
                await createSurat(formData);
                toast.success('Surat berhasil ditambahkan');
            }
            
            setOpen(false);
            if (!id) {
                form.reset();
                setSelectedFile(null);
                setFileUrl('');
                setUploadMode('file');
            }
        } catch (error) {
            toast.error((error as Error).message || `Gagal ${id ? 'memperbarui' : 'menambahkan'} surat`);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Surat
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle>{id ? 'Edit' : 'Tambah'} {type === 'MASUK' ? 'Surat Masuk' : 'Surat Keluar'}</DialogTitle>
                    <DialogDescription>
                        {id ? 'Perbarui detail surat di bawah ini.' : 'Isi detail surat di bawah ini. Nomor surat akan di-generate otomatis.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 min-h-0">
                    <Form {...form}>
                        <form id="surat-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <FormItem>
                                <FormLabel>File Surat (PDF)</FormLabel>
                                <FormControl>
                                    <UniversalUploader
                                        onFileSelected={(file) => setSelectedFile(file)}
                                        onUrlEntered={(url) => setFileUrl(url)}
                                        currentMode={uploadMode}
                                        onModeChange={setUploadMode}
                                        accept=".pdf,application/pdf"
                                        initialUrl={initialData?.fileUrl}
                                    />
                                </FormControl>
                            </FormItem>
                        </form>
                    </Form>
                </div>
                <DialogFooter className="px-6 pb-6 pt-4 border-t bg-background">
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                        Batal
                    </Button>
                    <Button type="submit" form="surat-form">
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
