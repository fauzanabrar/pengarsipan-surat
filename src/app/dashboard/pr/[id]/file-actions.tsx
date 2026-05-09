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
import { RABItemEditor } from '@/features/pr/components/rab-item-editor';
import { RABItem } from '@/features/pr/types';

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
                <DialogContent className="sm:max-w-[600px] p-0 flex flex-col max-h-[90vh]">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>{field === 'rabUrl' ? 'Ubah Dokumen & Rincian RAB' : 'Ganti File'}</DialogTitle>
                        <DialogDescription>
                            {field === 'rabUrl' ? 'Perbarui dokumen RAB dan rincian item jika diperlukan.' : 'Pilih file baru untuk menggantikan yang lama.'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="grid gap-6">
                            {field === 'rabUrl' && (
                                <RABItemEditor items={rabItems} onChange={setRabItems} />
                            )}

                            <div className="space-y-3">
                                <Label className="font-bold">{field === 'rabUrl' ? 'Upload Dokumen RAB Baru' : 'File Baru'}</Label>
                                <UniversalUploader 
                                    currentMode={uploadMode} 
                                    onModeChange={setUploadMode}
                                    onFileSelected={setSelectedFile} 
                                    onUrlEntered={setEnteredUrl}
                                    accept={field === 'rabUrl' ? ".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" : field === 'gambarUrl' ? "image/*,.pdf,application/pdf" : ".pdf,application/pdf"}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                        <Button variant="outline" onClick={() => setShowEdit(false)}>Batal</Button>
                        <Button onClick={handleEdit} disabled={isLoading}>Simpan Perubahan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
