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
        <div className="flex-1 space-y-10  max-w-6xl mx-auto">
            <ProfileForm key={dbUser.updatedAt.getTime()} user={dbUser} />
        </div>
    )
}

