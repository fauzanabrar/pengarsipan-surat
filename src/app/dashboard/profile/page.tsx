import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user) return null;

    // Fetch fresh user data from DB
    const dbUser = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
    });

    if (!dbUser) return null;

    return (
        <div className="flex-1 space-y-10 p-8 pt-6 max-w-6xl mx-auto">
            <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight">Profile</h1>
                <p className="text-muted-foreground text-lg">Manage your personal information and system avatar.</p>
            </div>

            <ProfileForm key={dbUser.updatedAt.getTime()} user={dbUser} />
        </div>
    )
}

