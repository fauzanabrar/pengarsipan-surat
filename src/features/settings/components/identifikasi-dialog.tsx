'use client';

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { createIdentifikasi, updateIdentifikasi } from "../actions";
import { toast } from "sonner";
import { Plus, Edit2 } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(1, "Nama harus diisi"),
    code: z.string().min(1, "Kode harus diisi"),
});

interface IdentifikasiDialogProps {
    id?: string;
    initialData?: {
        name: string;
        code: string;
    };
    trigger?: React.ReactNode;
}

export function IdentifikasiDialog({ id, initialData, trigger }: IdentifikasiDialogProps) {
    const [open, setOpen] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            name: "",
            code: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            if (id) {
                await updateIdentifikasi(id, values.name, values.code);
                toast.success("Identifikasi berhasil diperbarui");
            } else {
                await createIdentifikasi(values.name, values.code);
                toast.success("Identifikasi berhasil ditambahkan");
            }
            setOpen(false);
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Tambah Identifikasi
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{id ? "Edit Identifikasi" : "Tambah Identifikasi"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: Internal" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kode</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: INT" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">
                            {id ? "Simpan Perubahan" : "Tambah"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
