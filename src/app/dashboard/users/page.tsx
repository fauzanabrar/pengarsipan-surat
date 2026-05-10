import { auth } from "@/auth";
import { getUsersList } from "@/features/settings/actions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CardedTable } from "@/components/common/carded-table";
import { UserRoleToggle } from "@/features/settings/components/user-role-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function UsersPage() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return null;

    const data = await getUsersList();

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-8">
            <div className="px-2">
                <h2 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h2>
                <p className="text-sm text-muted-foreground">Kelola hak akses dan peran pengguna dalam sistem.</p>
            </div>

            <CardedTable>
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[300px]">Pengguna</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead className="w-[150px] text-right">Peran</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((user) => (
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
                                <TableCell className="text-right">
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
        </div>
    );
}
