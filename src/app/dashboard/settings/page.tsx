import { auth } from "@/auth";
import { 
    getSettings, 
    getIdentifikasiList, 
    getKodeSuratList, 
    getUsersList,
    deleteIdentifikasi,
    deleteKodeSurat
} from "@/features/settings/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormatSettingsForm } from "@/features/settings/components/format-settings-form";
import { IdentifikasiDialog } from "@/features/settings/components/identifikasi-dialog";
import { KodeSuratDialog } from "@/features/settings/components/kode-surat-dialog";
import { DeleteSettingButton } from "@/features/settings/components/delete-setting-button";
import { UserRoleToggle } from "@/features/settings/components/user-role-toggle";
import { ThemeSettings } from "@/features/settings/components/theme-settings";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CardedTable } from "@/components/common/carded-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit2, List, ListChecks, Users, Settings as SettingsIcon, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return null;

    // Fetch all data in parallel
    const [settingsData, identifikasiList, kodeSuratList, usersList] = await Promise.all([
        getSettings(),
        getIdentifikasiList(),
        getKodeSuratList(),
        getUsersList(),
    ]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-8">
            <div className="px-2">
                <h2 className="text-2xl font-bold tracking-tight">Pengaturan Administrator</h2>
                <p className="text-sm text-muted-foreground">Kelola seluruh konfigurasi sistem dan atribut pengarsipan dalam satu tempat.</p>
            </div>

            <Tabs defaultValue="format" className="w-full space-y-6">
                <div className="px-2 overflow-x-auto pb-2">
                    <TabsList className="bg-muted/50 p-1 h-12 inline-flex">
                        <TabsTrigger value="format" className="gap-2 h-10 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <SettingsIcon className="h-4 w-4" />
                            Format Nomor
                        </TabsTrigger>
                        <TabsTrigger value="identifikasi" className="gap-2 h-10 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <List className="h-4 w-4" />
                            Identifikasi
                        </TabsTrigger>
                        <TabsTrigger value="kode" className="gap-2 h-10 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <ListChecks className="h-4 w-4" />
                            Kode Surat
                        </TabsTrigger>
                        <TabsTrigger value="users" className="gap-2 h-10 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Users className="h-4 w-4" />
                            Pengguna
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="gap-2 h-10 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Palette className="h-4 w-4" />
                            Tampilan
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Format Nomor Surat */}
                <TabsContent value="format">
                    <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
                        <CardHeader className="bg-muted/30 pb-4 border-b">
                            <CardTitle className="text-lg">Struktur Nomor Surat</CardTitle>
                            <CardDescription>
                                Gunakan placeholder berikut:
                                <code className="mx-1 text-primary font-bold">{"{nomor}"}</code>, 
                                <code className="mx-1 text-primary font-bold">{"{kode}"}</code>, 
                                <code className="mx-1 text-primary font-bold">{"{identifikasi}"}</code>, 
                                <code className="mx-1 text-primary font-bold">{"{bulan}"}</code>, 
                                <code className="mx-1 text-primary font-bold">{"{tahun}"}</code>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <FormatSettingsForm initialFormat={settingsData.nomorSuratFormat} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Identifikasi */}
                <TabsContent value="identifikasi" className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="space-y-0.5">
                            <h3 className="text-lg font-semibold">Daftar Identifikasi</h3>
                            <p className="text-xs text-muted-foreground">Kategori asal atau sifat surat.</p>
                        </div>
                        <IdentifikasiDialog />
                    </div>
                    <CardedTable>
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[100px]">Kode</TableHead>
                                    <TableHead>Nama Identifikasi</TableHead>
                                    <TableHead className="w-[100px] text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {identifikasiList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic">Belum ada data.</TableCell>
                                    </TableRow>
                                ) : (
                                    identifikasiList.map((item) => (
                                        <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-bold text-primary">{item.code}</TableCell>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <IdentifikasiDialog 
                                                        id={item.id} 
                                                        initialData={{ name: item.name, code: item.code }} 
                                                        trigger={
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50">
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                        }
                                                    />
                                                    <DeleteSettingButton id={item.id} onDelete={deleteIdentifikasi} itemName={item.name} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardedTable>
                </TabsContent>

                {/* Kode Surat */}
                <TabsContent value="kode" className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="space-y-0.5">
                            <h3 className="text-lg font-semibold">Daftar Kode Surat</h3>
                            <p className="text-xs text-muted-foreground">Jenis atau kategori format surat.</p>
                        </div>
                        <KodeSuratDialog />
                    </div>
                    <CardedTable>
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[100px]">Kode</TableHead>
                                    <TableHead>Nama Kode</TableHead>
                                    <TableHead className="w-[100px] text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {kodeSuratList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic">Belum ada data.</TableCell>
                                    </TableRow>
                                ) : (
                                    kodeSuratList.map((item) => (
                                        <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-bold text-primary">{item.code}</TableCell>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <KodeSuratDialog 
                                                        id={item.id} 
                                                        initialData={{ name: item.name, code: item.code }} 
                                                        trigger={
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50">
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                        }
                                                    />
                                                    <DeleteSettingButton id={item.id} onDelete={deleteKodeSurat} itemName={item.name} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardedTable>
                </TabsContent>

                {/* Pengguna */}
                <TabsContent value="users" className="space-y-4">
                    <div className="px-2 space-y-0.5">
                        <h3 className="text-lg font-semibold">Manajemen Pengguna</h3>
                        <p className="text-xs text-muted-foreground">Kelola hak akses dan peran dalam sistem.</p>
                    </div>
                    <CardedTable>
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[300px]">Pengguna</TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead className="w-[150px] text-right pr-4">Peran</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usersList.map((user) => (
                                    <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatarUrl || ''} />
                                                    <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold">{user.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{user.email || 'No Email'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{user.username}</TableCell>
                                        <TableCell className="text-right pr-4">
                                            <UserRoleToggle 
                                                userId={user.id} 
                                                currentRole={user.role as 'ADMIN' | 'USER'} 
                                                isMe={user.id === session.user?.id}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardedTable>
                </TabsContent>

                {/* Tampilan */}
                <TabsContent value="appearance">
                    <ThemeSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
