import { db } from '@/db';
import { users } from '@/db/schema';
import { auth } from '@/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RoleSelector } from './role-selector';

export default async function AdminUsersPage() {
    const session = await auth();
    if (!session?.user) return null;

    const allUsers = await db.select().from(users).orderBy(users.createdAt);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">User Role Management</h2>
                    <p className="text-muted-foreground mt-2">
                        Configure organizational roles to define the Purchase Request approval chains (Like Mekari).
                    </p>
                </div>
            </div>

            <div className="border rounded-lg bg-card mt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Registered</TableHead>
                            <TableHead>System Role</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allUsers.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="font-medium">{u.name || u.username}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <RoleSelector userId={u.id} currentRole={u.role} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
