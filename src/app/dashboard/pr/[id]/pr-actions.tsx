'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    uploadGambar,
    createRAB,
    approveGAManager,
    submitPRCabang,
    verifikasiSpesifikasi,
    selesaikanPengadaan,
    rejectPurchaseRequest,
    requestRevision,
    deletePurchaseRequest
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UniversalUploader } from '@/components/universal-uploader';
import { uploadFile } from '@/lib/file-upload';
import { Plus, Trash2, ReceiptText, AlertCircle } from 'lucide-react';
import { RABItemEditor } from '@/features/pr/components/rab-item-editor';
import { RABItem } from '@/features/pr/types';

interface PRActionButtonsProps {
    prId: string;
    status: string;
    userRole: 'CABANG' | 'GA_STAFF' | 'GA_MANAGER';
    isOwner?: boolean;
    initialRabItems?: RABItem[];
    initialRabUrl?: string | null;
    initialRabNotes?: string | null;
    variant?: 'default' | 'minimal';
    category?: 'RAB' | 'GENERAL';
}

export function PRActionButtons({ 
    prId, status, userRole, isOwner, 
    initialRabItems, initialRabUrl, initialRabNotes,
    variant = 'default',
    category = 'GENERAL'
}: PRActionButtonsProps) {
    const [isLoading, setIsLoading] = useState(false);
    
    // Upload state for dialogs
    const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [enteredUrl, setEnteredUrl] = useState(initialRabUrl || "");
    const [keterangan, setKeterangan] = useState(initialRabNotes || "");
    
    // RAB Items state
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
    
    // Dialog states
    const [showUploadGambar, setShowUploadGambar] = useState(false);
    const [showCreateRAB, setShowCreateRAB] = useState(false);
    const [showApproveManager, setShowApproveManager] = useState(false);
    const [showSubmitPR, setShowSubmitPR] = useState(false);
    const [showVerifikasi, setShowVerifikasi] = useState(false);
    const [showComplete, setShowComplete] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [showRevision, setShowRevision] = useState(false);
    const [showDeletePR, setShowDeletePR] = useState(false);

    const resetState = () => {
        setSelectedFile(null);
        setEnteredUrl("");
        setKeterangan("");
        setUploadMode("file");
        setRabItems([{ name: '', category: 'Elektronik', quantity: 1, price: '' }]);
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

    const handleAction = async (actionFn: () => Promise<void>, successMsg: string, dialogSetter: (open: boolean) => void) => {
        setIsLoading(true);
        try {
            await actionFn();
            toast.success(successMsg);
            dialogSetter(false);
            resetState();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Terjadi kesalahan";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const getAvailableActions = () => {
        const actions: { label: string; onClick: () => void; variant?: 'default' | 'destructive' | 'outline' | 'secondary'; type: 'RAB' | 'OTHER' }[] = [];
        const role = userRole?.toUpperCase();

        if (role === 'GA_STAFF') {
            if (status === 'PENDING_GAMBAR') actions.push({ label: 'Upload Gambar', onClick: () => setShowUploadGambar(true), type: 'OTHER' });
            
            // RAB editing is available in both RAB creation and Manager Approval stages for STAFF only
            if (status === 'PENDING_RAB' || status === 'PENDING_GA_MANAGER') {
                const hasRab = initialRabUrl || (initialRabItems && initialRabItems.length > 0);
                actions.push({ 
                    label: hasRab ? 'Edit RAB' : 'Buat RAB', 
                    type: 'RAB',
                    onClick: () => {
                        // Ensure state matches current RAB if editing
                        if (hasRab) {
                            setEnteredUrl(initialRabUrl || "");
                            setKeterangan(initialRabNotes || "");
                            setUploadMode(initialRabUrl ? "url" : "file");
                            if (initialRabItems) {
                                setRabItems(initialRabItems.map(item => ({
                                    name: item.name,
                                    category: item.category,
                                    quantity: item.quantity,
                                    price: item.price.toString()
                                })));
                            }
                        }
                        setShowCreateRAB(true);
                    } 
                });
            }
            
            if (status === 'PENDING_VERIFIKASI') actions.push({ label: 'Verifikasi Spesifikasi', onClick: () => setShowVerifikasi(true), type: 'OTHER' });
            if (status === 'PENDING_PENGADAAN') actions.push({ label: 'Selesaikan Pengadaan', onClick: () => setShowComplete(true), type: 'OTHER' });
        }

        if (role === 'GA_MANAGER') {
            if (status === 'PENDING_GA_MANAGER') actions.push({ label: 'Approval Manager', onClick: () => setShowApproveManager(true), type: 'OTHER' });
        }

        if (status === 'PENDING_CABANG_PR' || status === 'REVISION') {
            if (isOwner) {
                actions.push({ label: 'Upload PR Approved', onClick: () => setShowSubmitPR(true), type: 'OTHER' });
            }
        }

        // Add Reject/Revision for staff and manager
        if (role !== 'CABANG' && !['COMPLETED', 'REJECTED'].includes(status)) {
            // Minta Revisi is NOT available for Gambar, RAB, or Manager Approval stages
            if (!['PENDING_GAMBAR', 'PENDING_RAB', 'PENDING_GA_MANAGER'].includes(status)) {
                actions.push({ label: 'Minta Revisi', onClick: () => setShowRevision(true), variant: 'outline', type: 'OTHER' });
            }
            
            // Tolak is NOT available for Gambar or RAB stages
            // Also, during GA Manager Approval and PR Upload stages, only the GA_MANAGER can reject
            const isRestrictedStage = ['PENDING_GA_MANAGER', 'PENDING_CABANG_PR'].includes(status);
            const canTolak = !['PENDING_GAMBAR', 'PENDING_RAB'].includes(status) && (!isRestrictedStage || role === 'GA_MANAGER');
            
            if (canTolak) {
                actions.push({ label: 'Tolak', onClick: () => setShowReject(true), variant: 'destructive', type: 'OTHER' });
            }
        }

        // Only owner can delete the PR and only during the first step
        if (isOwner && status === 'PENDING_GAMBAR') {
            actions.push({ label: 'Hapus Pengajuan', onClick: () => setShowDeletePR(true), variant: 'destructive', type: 'OTHER' });
        }

        return actions;
    };

        const actions = getAvailableActions();
        
        // Filter based on category if requested
        let filteredActions = actions;
        if (category === 'RAB') {
            filteredActions = actions.filter(a => a.type === 'RAB');
        } else if (variant === 'minimal') {
            // In minimal general mode, just show the first action
            filteredActions = actions.slice(0, 1);
        }
        
        if (filteredActions.length === 0) return null;

        return (
            <>
                <div className="flex gap-2 flex-wrap">
                    {filteredActions.map((action, index) => (
                        <Button
                            key={index}
                            variant={variant === 'minimal' ? 'secondary' : (action.variant || 'default')}
                            size={variant === 'minimal' ? 'sm' : 'default'}
                            className={variant === 'minimal' ? 'h-7 px-3 text-[11px] font-bold shadow-sm border' : ''}
                            onClick={action.onClick}
                            disabled={isLoading}
                        >
                            {action.label}
                        </Button>
                    ))}
                </div>

            {/* Stage 2: Upload Gambar */}
            <Dialog open={showUploadGambar} onOpenChange={setShowUploadGambar}>
                <DialogContent className="sm:max-w-[500px] p-0 flex flex-col max-h-[85vh]">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>Upload Gambar & Desain</DialogTitle>
                        <DialogDescription>Lampirkan gambar atau desain perencanaan untuk pengadaan ini.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="grid gap-4">
                            <UniversalUploader 
                                currentMode={uploadMode} onModeChange={setUploadMode}
                                onFileSelected={setSelectedFile} onUrlEntered={setEnteredUrl}
                                accept="image/*,.pdf,application/pdf"
                            />
                            <div className="grid gap-2">
                                <Label className="font-bold text-xs uppercase tracking-wider opacity-60">Keterangan Gambar</Label>
                                <Textarea placeholder="Keterangan gambar..." value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={3} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                        <Button variant="outline" onClick={() => setShowUploadGambar(false)} disabled={isLoading}>Batal</Button>
                        <Button onClick={() => handleAction(async () => {
                            const url = await handleFileUpload();
                            if (!url) throw new Error("Mohon lampirkan gambar");
                            await uploadGambar(prId, url, keterangan);
                        }, "Gambar berhasil diupload", setShowUploadGambar)} disabled={isLoading}>Simpan Gambar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stage 3: Create RAB */}
            <Dialog open={showCreateRAB} onOpenChange={setShowCreateRAB}>
                <DialogContent className="sm:max-w-[700px] p-0 flex flex-col max-h-[95vh]">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>Rencana Anggaran Biaya (RAB)</DialogTitle>
                        <DialogDescription>Detailkan item pengadaan dan lampirkan dokumen RAB.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="grid gap-6">
                            <RABItemEditor items={rabItems} onChange={setRabItems} />
                            
                            <div className="space-y-3 pt-4 border-t">
                                <Label className="font-bold">Dokumen RAB (Excel/PDF)</Label>
                                <UniversalUploader 
                                    currentMode={uploadMode} onModeChange={setUploadMode}
                                    onFileSelected={setSelectedFile} onUrlEntered={setEnteredUrl}
                                    accept=".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                />
                            </div>
                            
                            <div className="grid gap-2">
                                <Label className="font-bold">Keterangan RAB</Label>
                                <Textarea placeholder="Catatan tambahan..." value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={2} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                        <Button variant="outline" onClick={() => setShowCreateRAB(false)} disabled={isLoading}>Batal</Button>
                        <Button onClick={() => handleAction(async () => {
                            if (rabItems.some(i => !i.name || !i.price)) throw new Error("Mohon lengkapi detail item");
                            const url = await handleFileUpload();
                            if (!url) throw new Error("Mohon lampirkan dokumen RAB");
                            await createRAB(prId, url, keterangan, rabItems);
                        }, "RAB berhasil disimpan", setShowCreateRAB)} disabled={isLoading}>Simpan RAB</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stage 4: GA Manager Approval */}
            <Dialog open={showApproveManager} onOpenChange={setShowApproveManager}>
                <DialogContent className="sm:max-w-[600px] p-0 flex flex-col max-h-[85vh]">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>Approval GA Manager</DialogTitle>
                        <DialogDescription>Berikan persetujuan untuk RAB yang telah dibuat.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="grid gap-4">
                            <UniversalUploader 
                                currentMode={uploadMode} onModeChange={setUploadMode}
                                onFileSelected={setSelectedFile} onUrlEntered={setEnteredUrl}
                            />
                            <div className="grid gap-2">
                                <Label className="font-bold text-xs uppercase tracking-wider opacity-60">Catatan Approval</Label>
                                <Textarea placeholder="Catatan untuk Cabang..." value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={3} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                        <Button variant="outline" onClick={() => setShowApproveManager(false)} disabled={isLoading}>Batal</Button>
                        <Button onClick={() => handleAction(async () => {
                            const url = await handleFileUpload();
                            await approveGAManager(prId, url, keterangan);
                        }, "Persetujuan berhasil disimpan", setShowApproveManager)} disabled={isLoading}>Setujui & Teruskan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stage 5: Submit PR Approved */}
            <Dialog open={showSubmitPR} onOpenChange={setShowSubmitPR}>
                <DialogContent className="sm:max-w-[600px] p-0 flex flex-col max-h-[85vh]">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>Upload PR Approved</DialogTitle>
                        <DialogDescription>Lampirkan dokumen Purchase Request (PR) yang sudah ditandatangani.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="grid gap-4">
                            <UniversalUploader 
                                currentMode={uploadMode} onModeChange={setUploadMode}
                                onFileSelected={setSelectedFile} onUrlEntered={setEnteredUrl}
                            />
                            <div className="grid gap-2">
                                <Label className="font-bold text-xs uppercase tracking-wider opacity-60">Keterangan</Label>
                                <Textarea placeholder="Keterangan tambahan..." value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={3} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                        <Button variant="outline" onClick={() => setShowSubmitPR(false)} disabled={isLoading}>Batal</Button>
                        <Button onClick={() => handleAction(async () => {
                            const url = await handleFileUpload();
                            if (!url) throw new Error("Mohon lampirkan dokumen PR");
                            await submitPRCabang(prId, url, keterangan);
                        }, "PR berhasil diserahkan", setShowSubmitPR)} disabled={isLoading}>Upload Dokumen PR</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stage 6: Verifikasi */}
            <Dialog open={showVerifikasi} onOpenChange={setShowVerifikasi}>
                <DialogContent className="sm:max-w-[600px] p-0 flex flex-col max-h-[85vh]">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>Verifikasi Spesifikasi</DialogTitle>
                        <DialogDescription>Lampirkan dokumen verifikasi spesifikasi (opsional).</DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="grid gap-4">
                            <UniversalUploader 
                                currentMode={uploadMode} onModeChange={setUploadMode}
                                onFileSelected={setSelectedFile} onUrlEntered={setEnteredUrl}
                            />
                            <div className="grid gap-2">
                                <Label className="font-bold text-xs uppercase tracking-wider opacity-60">Keterangan Verifikasi</Label>
                                <Textarea placeholder="Detail verifikasi..." value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={3} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                        <Button variant="outline" onClick={() => setShowVerifikasi(false)} disabled={isLoading}>Batal</Button>
                        <Button onClick={() => handleAction(async () => {
                            const url = await handleFileUpload();
                            await verifikasiSpesifikasi(prId, url, keterangan);
                        }, "Verifikasi berhasil disimpan", setShowVerifikasi)} disabled={isLoading}>Verifikasi Sekarang</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stage 7: Complete */}
            <Dialog open={showComplete} onOpenChange={setShowComplete}>
                <DialogContent className="sm:max-w-[500px] p-0 flex flex-col max-h-[85vh]">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>Selesaikan Pengadaan</DialogTitle>
                        <DialogDescription>Konfirmasi bahwa proses pengadaan telah selesai sepenuhnya.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="grid gap-2">
                            <Label className="font-bold text-xs uppercase tracking-wider opacity-60">Catatan Penyelesaian</Label>
                            <Textarea placeholder="Catatan akhir..." value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={4} />
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                        <Button variant="outline" onClick={() => setShowComplete(false)} disabled={isLoading}>Batal</Button>
                        <Button onClick={() => handleAction(async () => {
                            await selesaikanPengadaan(prId, keterangan);
                        }, "Pengadaan telah selesai", setShowComplete)} disabled={isLoading}>Selesaikan PR</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showReject} onOpenChange={setShowReject}>
                <DialogContent className="sm:max-w-[500px] p-0 flex flex-col max-h-[85vh]">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="text-destructive flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Tolak Pengadaan</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin menolak permohonan pengadaan ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="grid gap-2">
                            <Label className="font-bold text-xs uppercase tracking-wider opacity-60">Alasan Penolakan</Label>
                            <Textarea placeholder="Tuliskan alasan penolakan..." value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={4} />
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                        <Button variant="outline" onClick={() => setShowReject(false)} disabled={isLoading}>Batal</Button>
                        <Button variant="destructive" onClick={() => handleAction(async () => {
                            if (!keterangan.trim()) throw new Error("Mohon berikan alasan penolakan");
                            await rejectPurchaseRequest(prId, keterangan);
                        }, "Pengadaan telah ditolak", setShowReject)} disabled={isLoading}>Tolak Sekarang</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revision Dialog */}
            <Dialog open={showRevision} onOpenChange={setShowRevision}>
                <DialogContent className="sm:max-w-[500px] p-0 flex flex-col max-h-[85vh]">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="text-yellow-600 flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Minta Revisi</DialogTitle>
                        <DialogDescription>Minta pengaju untuk melakukan revisi pada dokumen atau data pengadaan.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="grid gap-2">
                            <Label className="font-bold text-xs uppercase tracking-wider opacity-60">Detail Revisi</Label>
                            <Textarea placeholder="Apa yang perlu diperbaiki?..." value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={4} />
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                        <Button variant="outline" onClick={() => setShowRevision(false)} disabled={isLoading}>Batal</Button>
                        <Button className="bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => handleAction(async () => {
                            if (!keterangan.trim()) throw new Error("Mohon berikan detail revisi");
                            await requestRevision(prId, keterangan);
                        }, "Permintaan revisi telah dikirim", setShowRevision)} disabled={isLoading}>Kirim Permintaan Revisi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Delete PR Dialog */}
            <Dialog open={showDeletePR} onOpenChange={setShowDeletePR}>
                <DialogContent className="sm:max-w-[450px] p-0 flex flex-col max-h-[85vh]">
                    <DialogHeader className="px-6 py-6 border-b">
                        <DialogTitle className="text-destructive flex items-center gap-2"><Trash2 className="h-5 w-5" /> Hapus Pengajuan</DialogTitle>
                        <DialogDescription className="pt-2">
                            Apakah Anda yakin ingin menghapus seluruh pengajuan ini? 
                            Semua data dan file terkait akan dihapus secara permanen.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                        <Button variant="outline" onClick={() => setShowDeletePR(false)} disabled={isLoading}>Batal</Button>
                        <Button variant="destructive" onClick={() => handleAction(async () => {
                            await deletePurchaseRequest(prId);
                            window.location.href = '/dashboard/pr';
                        }, "Pengajuan telah dihapus", setShowDeletePR)} disabled={isLoading}>Hapus Permanen</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
