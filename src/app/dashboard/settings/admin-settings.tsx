"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { deleteAllPRs } from "@/features/pr/actions";
import { Trash2, AlertTriangle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function AdminSettings() {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDeleteAll = async () => {
        setIsDeleting(true);
        try {
            await deleteAllPRs();
            toast.success("Semua data pengadaan berhasil dihapus");
            setIsDialogOpen(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menghapus data";
            toast.error(message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Administrator Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Advanced settings and data management.
                </p>
            </div>
            
            <div className="grid gap-4">
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription>
                            Tindakan ini tidak dapat dibatalkan. Harap berhati-hati saat menggunakan fitur di bawah ini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-medium">Hapus Semua Data Pengadaan</h4>
                                <p className="text-sm text-muted-foreground">
                                    Menghapus permanen seluruh data Purchase Request beserta file yang terkait dari database.
                                </p>
                            </div>
                            
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" disabled={isDeleting}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {isDeleting ? "Menghapus..." : "Hapus Semua"}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Apakah Anda benar-benar yakin?</DialogTitle>
                                        <DialogDescription>
                                            Tindakan ini akan menghapus <strong>seluruh data pengadaan barang & jasa</strong> secara permanen dari server. Tindakan ini tidak dapat dibatalkan.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isDeleting}>
                                            Batal
                                        </Button>
                                        <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeleting}>
                                            Ya, Hapus Semua
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
