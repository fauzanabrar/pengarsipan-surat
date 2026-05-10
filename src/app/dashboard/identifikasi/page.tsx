import { auth } from "@/auth";
import { getIdentifikasiList, deleteIdentifikasi } from "@/features/settings/actions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CardedTable } from "@/components/common/carded-table";
import { IdentifikasiDialog } from "@/features/settings/components/identifikasi-dialog";
import { DeleteSettingButton } from "@/features/settings/components/delete-setting-button";
import { Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function IdentifikasiPage() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return null;

    const data = await getIdentifikasiList();

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-8">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Identifikasi</h2>
                    <p className="text-sm text-muted-foreground">Kelola kategori identifikasi surat.</p>
                </div>
                <IdentifikasiDialog />
            </div>

            <CardedTable>
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[100px]">Kode</TableHead>
                            <TableHead>Nama Identifikasi</TableHead>
                            <TableHead className="w-[120px] text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-12 text-muted-foreground italic">
                                    Belum ada data identifikasi.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-bold text-primary">{item.code}</TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <IdentifikasiDialog 
                                                id={item.id} 
                                                initialData={{ name: item.name, code: item.code }} 
                                                trigger={
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50">
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                            <DeleteSettingButton 
                                                id={item.id} 
                                                onDelete={deleteIdentifikasi} 
                                                itemName={item.name} 
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardedTable>
        </div>
    );
}
