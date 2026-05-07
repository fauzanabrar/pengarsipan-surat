'use client';

import { useState, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardCopy } from 'lucide-react';

interface PRActionButtonsProps {
    prId: string;
    status: string;
    userRole: string;
}

type UploadMethod = 'supabase' | 'local' | 'url';

// Helper function to show copyable error toast
function showErrorToast(message: string, details?: string) {
    toast.error(
        (t) => (
            <div className="flex flex-col gap-2">
                <span>{message}</span>
                {details && (
                    <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded max-w-md truncate">
                            {details}
                        </code>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                                navigator.clipboard.writeText(`${message}\n\n${details}`);
                                toast.success('Error message copied to clipboard');
                            }}
                        >
                            <ClipboardCopy className="h-3 w-3" />
                            Copy
                        </Button>
                    </div>
                )}
            </div>
        ),
        { duration: 10000 }
    );
}

export function PRActionButtons({ prId, status, userRole }: PRActionButtonsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [uploadMethod, setUploadMethod] = useState<UploadMethod>('local');
    const [fileUrl, setFileUrl] = useState('');
    
    // Dialog states for different actions
    const [showGambarDialog, setShowGambarDialog] = useState(false);
    const [showRABDialog, setShowRABDialog] = useState(false);
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [showPRSubmitDialog, setShowPRSubmitDialog] = useState(false);
    const [showVerifikasiDialog, setShowVerifikasiDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showRevisionDialog, setShowRevisionDialog] = useState(false);

    // Form refs
    const gambarFileRef = useRef<HTMLInputElement>(null);
    const rabFileRef = useRef<HTMLInputElement>(null);
    const approvalFileRef = useRef<HTMLInputElement>(null);
    const prFileRef = useRef<HTMLInputElement>(null);
    const verifikasiFilesRef = useRef<HTMLInputElement>(null);
    
    // RAB items state
    const [rabItems, setRabItems] = useState<{ name: string; quantity: number; price: number }[]>([
        { name: '', quantity: 1, price: 0 },
    ]);

    // Reject/Revision notes
    const [notes, setNotes] = useState('');

    const handleUploadGambar = async () => {
        setIsLoading(true);
        try {
            const file = gambarFileRef.current?.files?.[0];
            if (!file) {
                toast.error('Please select a file');
                setIsLoading(false);
                return;
            }
            await uploadGambar(prId, file);
            toast.success('Gambar uploaded successfully');
            setShowGambarDialog(false);
        } catch (error: any) {
            showErrorToast(error.message || 'Failed to upload gambar', error.stack);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRAB = async () => {
        setIsLoading(true);
        try {
            const file = rabFileRef.current?.files?.[0];
            const validItems = rabItems.filter(item => item.name.trim() !== '');

            await createRAB(prId, validItems, file);
            toast.success('RAB created successfully');
            setShowRABDialog(false);
            setRabItems([{ name: '', quantity: 1, price: 0 }]);
        } catch (error: any) {
            showErrorToast(error.message || 'Failed to create RAB', error.stack);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveGAManager = async () => {
        setIsLoading(true);
        try {
            const file = approvalFileRef.current?.files?.[0];
            if (!file) {
                toast.error('Please select approval file');
                setIsLoading(false);
                return;
            }
            await approveGAManager(prId, file);
            toast.success('RAB approved successfully');
            setShowApprovalDialog(false);
        } catch (error: any) {
            showErrorToast(error.message || 'Failed to approve RAB', error.stack);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitPRCabang = async () => {
        setIsLoading(true);
        try {
            const file = prFileRef.current?.files?.[0];
            if (!file) {
                toast.error('Please select approved PR file');
                setIsLoading(false);
                return;
            }
            // Validate file size (100MB limit)
            const maxSize = 100 * 1024 * 1024; // 100MB in bytes
            if (file.size > maxSize) {
                showErrorToast(
                    'File size exceeds 100MB limit',
                    `Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
                );
                setIsLoading(false);
                return;
            }
            await submitPRCabang(prId, file);
            toast.success('PR submitted successfully');
            setShowPRSubmitDialog(false);
        } catch (error: any) {
            showErrorToast(
                error.message || 'Failed to submit PR',
                error instanceof Error ? error.stack || error.message : String(error)
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifikasiSpesifikasi = async () => {
        setIsLoading(true);
        try {
            // Handle URL method
            if (uploadMethod === 'url') {
                const urls = fileUrl.split(',').map(u => u.trim()).filter(u => u !== '');
                if (urls.length === 0) {
                    toast.error('Please enter at least one URL');
                    setIsLoading(false);
                    return;
                }
                // We need to create a new action that accepts URLs
                // For now, use the file method
                toast.error('URL method not yet implemented - please upload files');
                setIsLoading(false);
                return;
            }

            const files = verifikasiFilesRef.current?.files;
            if (!files || files.length === 0) {
                toast.error('Please select at least one file');
                setIsLoading(false);
                return;
            }

            await verifikasiSpesifikasi(prId, Array.from(files));
            toast.success('Verification files uploaded successfully');
            setShowVerifikasiDialog(false);
            setFileUrl('');
        } catch (error: any) {
            showErrorToast(error.message || 'Failed to upload verification files', error.stack);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelesaikanPengadaan = async () => {
        setIsLoading(true);
        try {
            await selesaikanPengadaan(prId, 'Procurement completed');
            toast.success('Pengadaan completed successfully');
        } catch (error: any) {
            showErrorToast(error.message || 'Failed to complete pengadaan', error.stack);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        setIsLoading(true);
        try {
            if (!notes.trim()) {
                toast.error('Please provide a rejection reason');
                setIsLoading(false);
                return;
            }
            await rejectPurchaseRequest(prId, notes);
            toast.error('Purchase Request rejected');
            setShowRejectDialog(false);
            setNotes('');
        } catch (error: any) {
            showErrorToast(error.message || 'Failed to reject PR', error.stack);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevision = async () => {
        setIsLoading(true);
        try {
            if (!notes.trim()) {
                toast.error('Please provide revision notes');
                setIsLoading(false);
                return;
            }
            await requestRevision(prId, notes);
            toast.info('Revision requested');
            setShowRevisionDialog(false);
            setNotes('');
        } catch (error: any) {
            showErrorToast(error.message || 'Failed to request revision', error.stack);
        } finally {
            setIsLoading(false);
        }
    };

    const addRabItem = () => {
        setRabItems([...rabItems, { name: '', quantity: 1, price: 0 }]);
    };

    const updateRabItem = (index: number, field: keyof typeof rabItems[0], value: any) => {
        const newItems = [...rabItems];
        newItems[index] = { ...newItems[index], [field]: field === 'name' ? value : Number(value) };
        setRabItems(newItems);
    };

    const removeRabItem = (index: number) => {
        if (rabItems.length > 1) {
            const newItems = rabItems.filter((_, i) => i !== index);
            setRabItems(newItems);
        }
    };

    // Determine available actions based on role and status
    const getAvailableActions = () => {
        const actions: { label: string; onClick: () => void; variant?: 'default' | 'destructive' | 'outline' | 'secondary' }[] = [];

        // GA_STAFF actions
        if (userRole === 'GA_STAFF') {
            if (status === 'PENDING_GAMBAR') {
                actions.push({ label: 'Upload Gambar', onClick: () => setShowGambarDialog(true) });
            }
            if (status === 'PENDING_RAB') {
                actions.push({ label: 'Create RAB', onClick: () => setShowRABDialog(true) });
            }
            if (status === 'PENDING_VERIFIKASI') {
                actions.push({ label: 'Verifikasi Spesifikasi', onClick: () => setShowVerifikasiDialog(true) });
            }
            if (status === 'PENDING_PENGADAAN') {
                actions.push({ label: 'Selesaikan Pengadaan', onClick: handleSelesaikanPengadaan });
            }
            // Reject/Revision for GA_STAFF
            if (['PENDING_GAMBAR', 'PENDING_RAB', 'PENDING_VERIFIKASI', 'PENDING_PENGADAAN'].includes(status)) {
                actions.push({ label: 'Request Revision', onClick: () => setShowRevisionDialog(true), variant: 'secondary' });
                actions.push({ label: 'Reject', onClick: () => setShowRejectDialog(true), variant: 'destructive' });
            }
        }

        // GA_MANAGER actions
        if (userRole === 'GA_MANAGER') {
            if (status === 'PENDING_GA_MANAGER') {
                actions.push({ label: 'Approve RAB', onClick: () => setShowApprovalDialog(true) });
                actions.push({ label: 'Request Revision', onClick: () => setShowRevisionDialog(true), variant: 'secondary' });
                actions.push({ label: 'Reject', onClick: () => setShowRejectDialog(true), variant: 'destructive' });
            }
        }

        // CABANG actions
        if (userRole === 'CABANG') {
            if (status === 'PENDING_CABANG_PR') {
                actions.push({ label: 'Submit PR', onClick: () => setShowPRSubmitDialog(true) });
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

            {/* Upload Gambar Dialog */}
            <Dialog open={showGambarDialog} onOpenChange={setShowGambarDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Gambar</DialogTitle>
                        <DialogDescription>Upload the drawing/design file for this PR.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="gambar-file">Gambar File</Label>
                            <Input id="gambar-file" type="file" ref={gambarFileRef} accept="image/*,.pdf" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowGambarDialog(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleUploadGambar} disabled={isLoading}>
                            {isLoading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create RAB Dialog */}
            <Dialog open={showRABDialog} onOpenChange={setShowRABDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create RAB (Budget Plan)</DialogTitle>
                        <DialogDescription>Add items and pricing for this PR.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="rab-file">RAB File (Optional)</Label>
                            <Input id="rab-file" type="file" ref={rabFileRef} accept=".xlsx,.xls,.csv,.pdf" />
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                                <Label>Items</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addRabItem}>
                                    Add Item
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {rabItems.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <Label className="text-xs">Item Name</Label>
                                            <Input
                                                placeholder="Item name"
                                                value={item.name}
                                                onChange={(e) => updateRabItem(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-20">
                                            <Label className="text-xs">Qty</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateRabItem(index, 'quantity', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-32">
                                            <Label className="text-xs">Price (Rp)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.price}
                                                onChange={(e) => updateRabItem(index, 'price', e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeRabItem(index)}
                                            disabled={rabItems.length === 1}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRABDialog(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateRAB} disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create RAB'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* GA Manager Approval Dialog */}
            <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve RAB</DialogTitle>
                        <DialogDescription>Upload approval document to approve this RAB.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="approval-file">Approval File</Label>
                            <Input id="approval-file" type="file" ref={approvalFileRef} accept=".pdf,.doc,.docx" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApprovalDialog(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleApproveGAManager} disabled={isLoading}>
                            {isLoading ? 'Approving...' : 'Approve'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cabang PR Submit Dialog */}
            <Dialog open={showPRSubmitDialog} onOpenChange={setShowPRSubmitDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit PR</DialogTitle>
                        <DialogDescription>Upload the internally approved PR file from Cabang.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="pr-file">Approved PR File</Label>
                            <Input id="pr-file" type="file" ref={prFileRef} accept=".pdf,.doc,.docx" />
                            <p className="text-xs text-muted-foreground">Maximum file size: 100MB</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPRSubmitDialog(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmitPRCabang} disabled={isLoading}>
                            {isLoading ? 'Submitting...' : 'Submit PR'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Verifikasi Spesifikasi Dialog */}
            <Dialog open={showVerifikasiDialog} onOpenChange={setShowVerifikasiDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verifikasi Spesifikasi</DialogTitle>
                        <DialogDescription>Upload specification verification files (multi-file supported).</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Upload Method</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={uploadMethod === 'local' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setUploadMethod('local')}
                                >
                                    File Upload
                                </Button>
                                <Button
                                    type="button"
                                    variant={uploadMethod === 'url' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setUploadMethod('url')}
                                >
                                    URL
                                </Button>
                            </div>
                        </div>
                        {uploadMethod === 'local' ? (
                            <div className="grid gap-2">
                                <Label htmlFor="verifikasi-files">Verification Files</Label>
                                <Input id="verifikasi-files" type="file" ref={verifikasiFilesRef} multiple accept="image/*,.pdf,.xlsx,.xls,.doc,.docx" />
                                <p className="text-xs text-muted-foreground">Select multiple files to upload</p>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <Label htmlFor="file-urls">File URLs</Label>
                                <Textarea
                                    id="file-urls"
                                    placeholder="Enter URLs separated by commas"
                                    value={fileUrl}
                                    onChange={(e) => setFileUrl(e.target.value)}
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground">Enter external file URLs separated by commas</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowVerifikasiDialog(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleVerifikasiSpesifikasi} disabled={isLoading}>
                            {isLoading ? 'Uploading...' : 'Upload Files'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject PR</DialogTitle>
                        <DialogDescription>Provide a reason for rejecting this PR.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="reject-notes">Rejection Reason</Label>
                            <Textarea
                                id="reject-notes"
                                placeholder="Enter reason for rejection..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isLoading}>
                            {isLoading ? 'Rejecting...' : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revision Dialog */}
            <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Revision</DialogTitle>
                        <DialogDescription>Provide notes for the required revision.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="revision-notes">Revision Notes</Label>
                            <Textarea
                                id="revision-notes"
                                placeholder="Enter what needs to be revised..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRevisionDialog(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button variant="secondary" onClick={handleRevision} disabled={isLoading}>
                            {isLoading ? 'Requesting...' : 'Request Revision'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
