import { db } from '@/db';
import { users } from '@/db/schema';
import { auth } from '@/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { UserClientTable } from './user-client-table';

export default async function AdminUsersPage() {
    const session = await auth();
    if (!session?.user) return null;

    const allUsers = await db.select().from(users).orderBy(users.createdAt);

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl mx-auto">
            <Card className="shadow-xl shadow-black/5 border-none ring-1 ring-black/5 dark:ring-white/10 overflow-hidden bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="bg-muted/30 border-b pb-5">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        User Role Management
                    </CardTitle>
                    <CardDescription>
                        Manage roles and permissions for <span className="font-bold text-foreground">{allUsers.length}</span> registered users across the organization.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <UserClientTable initialUsers={allUsers} />
                </CardContent>
            </Card>
        </div>
    );
}

