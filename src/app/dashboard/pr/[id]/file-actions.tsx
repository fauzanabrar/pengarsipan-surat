'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import { updatePRField } from '@/features/pr/actions';
import { toast } from 'sonner';
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

interface PRFileActionsProps {
    prId: string;
    field: string;
    canEdit: boolean;
    canDelete?: boolean;
}

export function PRFileActions({ prId, field, canEdit, canDelete = false }: PRFileActionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    
    // Edit state
    const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [enteredUrl, setEnteredUrl] = useState("");

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

            await updatePRField(prId, field, fileUrl, `Mengubah file: ${field}`);
            toast.success('File berhasil diperbarui');
            setShowEdit(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-1 opacity-0 group-hover/file:opacity-100 transition-opacity">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => setShowEdit(true)}
                disabled={isLoading}
            >
                <Edit className="h-4 w-4" />
            </Button>
            {canDelete && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setShowDelete(true)}
                    disabled={isLoading}
                >
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
                        <DialogTitle>Ganti File</DialogTitle>
                        <DialogDescription>
                            Pilih file baru untuk menggantikan yang lama.
                        </DialogDescription>
                    </DialogHeader>
                    <UniversalUploader 
                        currentMode={uploadMode} 
                        onModeChange={setUploadMode}
                        onFileSelected={setSelectedFile} 
                        onUrlEntered={setEnteredUrl}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEdit(false)}>Batal</Button>
                        <Button onClick={handleEdit} disabled={isLoading}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
