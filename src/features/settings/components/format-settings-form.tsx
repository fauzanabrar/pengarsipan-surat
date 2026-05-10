'use client';

import { Button } from "@/components/ui/button";
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
import { updateNomorSuratFormat } from "../actions";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
    format: z.string().min(1, "Format harus diisi"),
});

interface FormatSettingsFormProps {
    initialFormat: string;
}

export function FormatSettingsForm({ initialFormat }: FormatSettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            format: initialFormat,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true);
            await updateNomorSuratFormat(values.format);
            toast.success("Format nomor surat berhasil diperbarui");
        } catch (error) {
            toast.error("Terjadi kesalahan saat menyimpan");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-bold">Struktur Format</FormLabel>
                            <FormControl>
                                <div className="space-y-3">
                                    <Input 
                                        className="h-12 text-lg font-mono tracking-wider border-2" 
                                        {...field} 
                                    />
                                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                        <p className="text-xs font-bold text-primary uppercase mb-2">Pratinjau Hasil:</p>
                                        <p className="text-sm font-mono text-muted-foreground break-all">
                                            {field.value
                                                .replace("{nomor}", "001")
                                                .replace("{kode}", "SE")
                                                .replace("{identifikasi}", "INT")
                                                .replace("{bulan}", "XI")
                                                .replace("{tahun}", "2026")
                                            }
                                        </p>
                                    </div>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full sm:w-auto px-8 h-11" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? "Menyimpan..." : "Simpan Format"}
                </Button>
            </form>
        </Form>
    );
}
