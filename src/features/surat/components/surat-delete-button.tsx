'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { deleteSurat } from '../actions';

interface SuratDeleteButtonProps {
    suratId: string;
    nomorSurat: string;
    type: 'MASUK' | 'KELUAR';
}

export function SuratDeleteButton({ suratId, nomorSurat, type }: SuratDeleteButtonProps) {
    const [suratToDelete, setSuratToDelete] = useState<{id: string; nomorSurat: string; type: 'MASUK' | 'KELUAR'} | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = () => {
        setSuratToDelete({ id: suratId, nomorSurat, type });
    };

    const handleDeleteConfirm = async () => {
        if (!suratToDelete) return;
        
        try {
            setIsDeleting(true);
            await deleteSurat(suratToDelete.id, suratToDelete.type);
            setSuratToDelete(null);
        } catch (error) {
            console.error('Failed to delete surat:', error);
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                onClick={handleDeleteClick}
                title="Hapus"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>

            <Dialog open={!!suratToDelete} onOpenChange={(open) => !open && setSuratToDelete(null)}>
                <DialogContent className="max-w-sm border-destructive/20 bg-gradient-to-br from-background to-background/95">
                    <DialogHeader className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-destructive/10">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                            <div className="flex-1">
                                <DialogTitle className="text-destructive text-lg">Hapus Surat</DialogTitle>
                                <DialogDescription className="mt-1 text-sm leading-relaxed">
                                    Apakah Anda yakin ingin menghapus surat <strong className="text-foreground font-semibold">{suratToDelete?.nomorSurat}</strong>? 
                                    <span className="block mt-2 text-destructive/80">Tindakan ini tidak dapat dibatalkan dan akan menghapus data secara permanen.</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <DialogFooter className="mt-6 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setSuratToDelete(null)}
                            disabled={isDeleting}
                            className="transition-colors"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="gap-2 transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                            {isDeleting ? 'Menghapus...' : 'Hapus Surat'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

