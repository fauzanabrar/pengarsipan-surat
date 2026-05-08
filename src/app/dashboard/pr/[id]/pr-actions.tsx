'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    uploadRAB,
    uploadPR,
    verifikasiManager
} from '@/features/pr/actions';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UniversalUploader } from '@/components/universal-uploader';
import { uploadFile } from '@/lib/file-upload';

interface PRActionButtonsProps {
    prId: string;
    status: string;
    userRole: string;
}

export function PRActionButtons({ prId, status, userRole }: PRActionButtonsProps) {
    const [isLoading, setIsLoading] = useState(false);
    
    // Upload state for dialogs
    const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [enteredUrl, setEnteredUrl] = useState("");
    const [keterangan, setKeterangan] = useState("");
    
    // Dialog states
    const [showUploadRAB, setShowUploadRAB] = useState(false);
    const [showUploadPR, setShowUploadPR] = useState(false);
    const [showVerifikasi, setShowVerifikasi] = useState(false);
    const [verifikasiAction, setVerifikasiAction] = useState<'DITERIMA' | 'DITOLAK'>('DITERIMA');

    const resetUploadState = () => {
        setSelectedFile(null);
        setEnteredUrl("");
        setKeterangan("");
        setUploadMode("file");
    };

    const handleFileUpload = async () => {
        let fileUrl = null;
        if (uploadMode === "file" && selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);
            fileUrl = await uploadFile(formData);
        } else if (uploadMode === "url" && enteredUrl) {
            fileUrl = enteredUrl;
        }
        return fileUrl;
    };

    const handleUploadRABSubmit = async () => {
        setIsLoading(true);
        try {
            const fileUrl = await handleFileUpload();
            if (!fileUrl) {
                toast.error("Mohon lampirkan dokumen RAB");
                setIsLoading(false);
                return;
            }
            await uploadRAB(prId, fileUrl, keterangan);
            toast.success("RAB berhasil diupload");
            setShowUploadRAB(false);
            resetUploadState();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal upload RAB";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadPRSubmit = async () => {
        setIsLoading(true);
        try {
            const fileUrl = await handleFileUpload();
            if (!fileUrl) {
                toast.error("Mohon lampirkan dokumen PR");
                setIsLoading(false);
                return;
            }
            await uploadPR(prId, fileUrl, keterangan);
            toast.success("PR berhasil diupload");
            setShowUploadPR(false);
            resetUploadState();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal upload PR";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifikasiSubmit = async () => {
        setIsLoading(true);
        try {
            if (verifikasiAction === 'DITOLAK' && !keterangan.trim()) {
                toast.error("Mohon berikan alasan penolakan pada Keterangan");
                setIsLoading(false);
                return;
            }
            await verifikasiManager(prId, verifikasiAction, keterangan);
            toast.success(`Pengadaan berhasil ${verifikasiAction === 'DITERIMA' ? 'diterima' : 'ditolak'}`);
            setShowVerifikasi(false);
            resetUploadState();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal memverifikasi pengadaan";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const getAvailableActions = () => {
        const actions: { label: string; onClick: () => void; variant?: 'default' | 'destructive' | 'outline' | 'secondary' }[] = [];

        if (userRole === 'GA_STAFF') {
            if (status === 'MENUNGGU_RAB') {
                actions.push({ label: 'Upload RAB', onClick: () => setShowUploadRAB(true) });
            }
            if (status === 'MENUNGGU_PR') {
                actions.push({ label: 'Upload PR', onClick: () => setShowUploadPR(true) });
            }
        }

        if (userRole === 'GA_MANAGER') {
            if (status === 'MENUNGGU_DIVERIFIKASI') {
                actions.push({ label: 'Verifikasi Pengadaan', onClick: () => setShowVerifikasi(true) });
            }
        }

        return actions;
    };

    const actions = getAvailableActions();
    if (actions.length === 0) return null;

    return (
        <>
            <div className="flex gap-2 flex-wrap">
                {actions.map((action, index) => (
                    <Button
                        key={index}
                        variant={action.variant || 'default'}
                        onClick={action.onClick}
                        disabled={isLoading}
                    >
                        {action.label}
                    </Button>
                ))}
            </div>

            {/* Upload RAB Dialog */}
            <Dialog open={showUploadRAB} onOpenChange={setShowUploadRAB}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Upload Dokumen RAB</DialogTitle>
                        <DialogDescription>Upload dokumen Rencana Anggaran Biaya untuk pengadaan ini.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <UniversalUploader 
                            currentMode={uploadMode}
                            onModeChange={setUploadMode}
                            onFileSelected={setSelectedFile}
                            onUrlEntered={setEnteredUrl}
                        />
                        <div className="grid gap-2">
                            <Label>Keterangan Tambahan (Opsional)</Label>
                            <Textarea
                                placeholder="Keterangan mengenai RAB..."
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUploadRAB(false)} disabled={isLoading}>
                            Batal
                        </Button>
                        <Button onClick={handleUploadRABSubmit} disabled={isLoading}>
                            {isLoading ? 'Mengupload...' : 'Simpan RAB'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload PR Dialog */}
            <Dialog open={showUploadPR} onOpenChange={setShowUploadPR}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Upload Dokumen PR</DialogTitle>
                        <DialogDescription>Upload dokumen Purchase Request final.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <UniversalUploader 
                            currentMode={uploadMode}
                            onModeChange={setUploadMode}
                            onFileSelected={setSelectedFile}
                            onUrlEntered={setEnteredUrl}
                        />
                        <div className="grid gap-2">
                            <Label>Keterangan Tambahan (Opsional)</Label>
                            <Textarea
                                placeholder="Keterangan mengenai PR..."
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUploadPR(false)} disabled={isLoading}>
                            Batal
                        </Button>
                        <Button onClick={handleUploadPRSubmit} disabled={isLoading}>
                            {isLoading ? 'Mengupload...' : 'Simpan PR'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Verifikasi Manager Dialog */}
            <Dialog open={showVerifikasi} onOpenChange={setShowVerifikasi}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Verifikasi Pengadaan</DialogTitle>
                        <DialogDescription>Keputusan untuk menyetujui atau menolak permohonan pengadaan ini.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Keterangan / Catatan Manager</Label>
                            <Textarea
                                placeholder="Berikan catatan persetujuan atau alasan penolakan..."
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                type="button"
                                variant={verifikasiAction === 'DITERIMA' ? 'default' : 'outline'}
                                className="flex-1"
                                onClick={() => setVerifikasiAction('DITERIMA')}
                            >
                                Terima Pengadaan
                            </Button>
                            <Button
                                type="button"
                                variant={verifikasiAction === 'DITOLAK' ? 'destructive' : 'outline'}
                                className="flex-1"
                                onClick={() => setVerifikasiAction('DITOLAK')}
                            >
                                Tolak Pengadaan
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowVerifikasi(false)} disabled={isLoading}>
                            Batal
                        </Button>
                        <Button onClick={handleVerifikasiSubmit} disabled={isLoading} variant={verifikasiAction === 'DITERIMA' ? 'default' : 'destructive'}>
                            {isLoading ? 'Menyimpan...' : 'Konfirmasi Keputusan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
