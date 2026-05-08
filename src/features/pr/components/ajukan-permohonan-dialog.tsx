"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UniversalUploader } from "@/components/universal-uploader"
import { ajukanPermohonan } from "@/features/pr/actions"
import { uploadFile } from "@/lib/file-upload"
import { toast } from "sonner"
import { Plus } from "lucide-react"

const formSchema = z.object({
    title: z.string().min(3, "Judul pengadaan minimal 3 karakter"),
    keterangan: z.string().optional(),
})

export function AjukanPermohonanDialog() {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    // File/URL state
    const [uploadMode, setUploadMode] = useState<"file" | "url">("file")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [enteredUrl, setEnteredUrl] = useState("")

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            keterangan: "",
        },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true)
        try {
            let fileUrl = null;

            if (uploadMode === "file" && selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                fileUrl = await uploadFile(formData);
            } else if (uploadMode === "url" && enteredUrl) {
                fileUrl = enteredUrl;
            }

            if (!fileUrl) {
                toast.error("Mohon lampirkan dokumen (File atau URL)");
                setIsSubmitting(false);
                return;
            }

            await ajukanPermohonan(values.title, fileUrl, values.keterangan || "");
            
            toast.success("Permohonan berhasil diajukan");
            setOpen(false);
            form.reset();
            setSelectedFile(null);
            setEnteredUrl("");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal mengajukan permohonan";
            toast.error(message);
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs font-bold">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> 
                    <span className="hidden xs:inline">Ajukan Permohonan</span>
                    <span className="xs:hidden">Ajukan Permohonan</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Ajukan Permohonan Pengadaan</DialogTitle>
                    <DialogDescription>
                        Lengkapi form di bawah ini untuk mengajukan permohonan pengadaan barang/jasa baru.
                    </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Judul Pengadaan <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: Pembelian Laptop Kantor" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-3">
                            <FormLabel>Dokumen Surat Pengajuan <span className="text-red-500">*</span></FormLabel>
                            <UniversalUploader 
                                currentMode={uploadMode}
                                onModeChange={setUploadMode}
                                onFileSelected={setSelectedFile}
                                onUrlEntered={setEnteredUrl}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="keterangan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Keterangan Tambahan (Opsional)</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Tuliskan detail tambahan jika diperlukan..." 
                                            className="resize-none" 
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Menyimpan..." : "Ajukan Sekarang"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
