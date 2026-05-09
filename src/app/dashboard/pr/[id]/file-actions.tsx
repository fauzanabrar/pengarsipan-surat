'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, ReceiptText, Plus } from 'lucide-react';
import { updatePRField, createRAB } from '@/features/pr/actions';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { UniversalUploader } from '@/components/universal-uploader';
import { uploadFile } from '@/lib/file-upload';

interface RABItem {
    name: string;
    category: string;
    quantity: number;
    price: string;
}

const CATEGORIES = [
    "Elektronik",
    "Funitur",
    "Kendaraan",
    "Peralatan",
    "Software",
    "Lainnya"
];

interface PRFileActionsProps {
    prId: string;
    field: string;
    canEdit: boolean;
    canDelete?: boolean;
    initialRabItems?: RABItem[];
}

export function PRFileActions({ prId, field, canEdit, canDelete = false, initialRabItems }: PRFileActionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    
    // Edit state
    const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [enteredUrl, setEnteredUrl] = useState("");
    
    // Bulk add state
    const [bulkInput, setBulkInput] = useState("");
    const [showBulkAdd, setShowBulkAdd] = useState(false);

    const handleBulkAdd = () => {
        const lines = bulkInput.split('\n').filter(line => line.trim() !== '');
        const newItems: RABItem[] = lines.map(line => {
            const parts = line.split(/[,;\t]/).map(p => p.trim());
            return {
                name: parts[0] || 'Item Baru',
                category: CATEGORIES.includes(parts[1]) ? parts[1] : 'Lainnya',
                quantity: parseInt(parts[2]) || 1,
                price: parts[3] || '0'
            };
        });
        
        setRabItems([...rabItems.filter(i => i.name !== ''), ...newItems]);
        setBulkInput("");
        setShowBulkAdd(false);
        toast.success(`${newItems.length} item berhasil ditambahkan`);
    };

    // RAB Items state (only used if field === 'rabUrl')
    const [rabItems, setRabItems] = useState<RABItem[]>(
        initialRabItems && initialRabItems.length > 0 
            ? initialRabItems.map(item => ({
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                price: item.price.toString()
            }))
            : [{ name: '', category: 'Elektronik', quantity: 1, price: '' }]
    );

    const addRabItem = () => setRabItems([...rabItems, { name: '', category: 'Elektronik', quantity: 1, price: '' }]);
    const removeRabItem = (index: number) => setRabItems(rabItems.filter((_, i) => i !== index));
    const updateRabItem = (index: number, field: keyof RABItem, value: string | number) => {
        const newItems = [...rabItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setRabItems(newItems);
    };

    if (!canEdit) return null;

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await updatePRField(prId, field, null, `Menghapus file: ${field}`);
            toast.success('File berhasil dihapus');
            setShowDelete(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async () => {
        setIsLoading(true);
        try {
            let fileUrl = null;
            if (uploadMode === "file" && selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                fileUrl = await uploadFile(formData);
            } else if (uploadMode === "url" && enteredUrl) {
                fileUrl = enteredUrl;
            }

            if (!fileUrl) throw new Error("Mohon lampirkan file");
            
            if (field === 'rabUrl') {
                // Specialized handling for RAB - update items too
                await createRAB(prId, fileUrl, "Diperbarui via Ubah Dokumen", rabItems);
            } else {
                await updatePRField(prId, field, fileUrl, `Mengubah file: ${field}`);
            }
            
            toast.success('File berhasil diperbarui');
            setShowEdit(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button 
                variant="secondary" 
                size="sm" 
                className="gap-2 shrink-0"
                onClick={() => setShowEdit(true)}
                disabled={isLoading}
            >
                <span className="hidden sm:inline">Ubah</span>
                <Edit className="h-4 w-4" />
            </Button>
            {canDelete && (
                <Button 
                    variant="secondary" 
                    size="sm" 
                    className="gap-2 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => setShowDelete(true)}
                    disabled={isLoading}
                >
                    <span className="hidden sm:inline">Hapus</span>
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}

            {/* Delete Dialog */}
            {canDelete && (
                <Dialog open={showDelete} onOpenChange={setShowDelete}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus File</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus file ini?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDelete(false)}>Batal</Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>Hapus</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Edit Dialog */}
            <Dialog open={showEdit} onOpenChange={setShowEdit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{field === 'rabUrl' ? 'Ubah Dokumen & Rincian RAB' : 'Ganti File'}</DialogTitle>
                        <DialogDescription>
                            {field === 'rabUrl' ? 'Perbarui dokumen RAB dan rincian item jika diperlukan.' : 'Pilih file baru untuk menggantikan yang lama.'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                        {field === 'rabUrl' && (
                            <div className="space-y-4 pb-4 border-b">
                                <Label className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><ReceiptText className="h-4 w-4" /> Item Rincian RAB</div>
                                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold" onClick={() => setShowBulkAdd(!showBulkAdd)}>
                                        {showBulkAdd ? 'Tutup Bulk Add' : 'Tambah Banyak (Bulk)'}
                                    </Button>
                                </Label>
                                
                                {showBulkAdd && (
                                    <div className="space-y-2 p-3 bg-muted/50 border rounded-md">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Format: Nama Item, Kategori, Qty, Harga (Pisahkan koma/tab)</Label>
                                        <Textarea 
                                            placeholder="Contoh:&#10;Laptop, Elektronik, 2, 15000000&#10;Kursi, Funitur, 10, 500000" 
                                            rows={4} 
                                            className="text-xs font-mono"
                                            value={bulkInput}
                                            onChange={(e) => setBulkInput(e.target.value)}
                                        />
                                        <Button type="button" size="sm" className="w-full text-xs h-8" onClick={handleBulkAdd} disabled={!bulkInput.trim()}>
                                            Proses & Tambah ke Daftar
                                        </Button>
                                    </div>
                                )}

                                {rabItems.map((item, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 border p-3 rounded-md bg-muted/30 relative group">
                                        <div className="flex gap-2 items-end">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Nama Item</Label>
                                                <Input className="h-8 text-sm" placeholder="Nama item" value={item.name} onChange={(e) => updateRabItem(idx, 'name', e.target.value)} />
                                            </div>
                                            <div className="w-[120px] space-y-1">
                                                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Kategori</Label>
                                                <Select value={item.category} onValueChange={(val) => updateRabItem(idx, 'category', val)}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CATEGORIES.map(cat => (
                                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-end">
                                            <div className="w-16 space-y-1">
                                                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Qty</Label>
                                                <Input className="h-8 text-sm" type="number" min="1" value={item.quantity} onChange={(e) => updateRabItem(idx, 'quantity', parseInt(e.target.value))} />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Harga Satuan</Label>
                                                <Input className="h-8 text-sm" type="number" placeholder="Harga" value={item.price} onChange={(e) => updateRabItem(idx, 'price', e.target.value)} />
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeRabItem(idx)} disabled={rabItems.length === 1}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" className="w-full gap-2 h-8 text-xs" onClick={addRabItem}>
                                    <Plus className="h-3 w-3" /> Tambah Item
                                </Button>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label className="text-sm font-bold">{field === 'rabUrl' ? 'Upload Dokumen RAB Baru' : 'File Baru'}</Label>
                            <UniversalUploader 
                                currentMode={uploadMode} 
                                onModeChange={setUploadMode}
                                onFileSelected={setSelectedFile} 
                                onUrlEntered={setEnteredUrl}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEdit(false)}>Batal</Button>
                        <Button onClick={handleEdit} disabled={isLoading}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
