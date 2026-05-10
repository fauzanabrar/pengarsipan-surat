'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppearanceSettings } from "./appearance-settings"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getSettings, updateSettings } from "@/features/surat/actions"
import { useEffect, useState } from "react"
import { Settings as SettingsType } from "@/db/schema"
import { toast } from "sonner"

const formSchema = z.object({
    nomorSuratFormat: z.string().min(1, "Format harus diisi"),
})

export default function SettingsPage() {
    const [settings, setSettings] = useState<SettingsType | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nomorSuratFormat: "",
        },
    })

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const data = await getSettings()
        setSettings(data)
        form.reset({ nomorSuratFormat: data.nomorSuratFormat })
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await updateSettings(values.nomorSuratFormat)
            toast.success("Pengaturan berhasil disimpan")
        } catch (error) {
            toast.error((error as Error).message || "Gagal menyimpan pengaturan")
        }
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h1>
            </div>

            <Tabs defaultValue="format" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="format">Format Nomor Surat</TabsTrigger>
                    <TabsTrigger value="appearance">Tampilan</TabsTrigger>
                </TabsList>

                <TabsContent value="format" className="space-y-4">
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Gunakan placeholder berikut: <code className="bg-muted px-1.5 py-0.5 rounded">{`{nomor}`}</code>, <code className="bg-muted px-1.5 py-0.5 rounded">{`{kode}`}</code>, <code className="bg-muted px-1.5 py-0.5 rounded">{`{identifikasi}`}</code>, <code className="bg-muted px-1.5 py-0.5 rounded">{`{tahun}`}</code>
                        </p>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="nomorSuratFormat"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Format Nomor Surat</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contoh: {nomor}/{kode}/{identifikasi}/{tahun}" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit">Simpan Pengaturan</Button>
                            </form>
                        </Form>
                    </div>
                </TabsContent>

                <TabsContent value="appearance">
                    <AppearanceSettings />
                </TabsContent>
            </Tabs>
        </div>
    )
}
