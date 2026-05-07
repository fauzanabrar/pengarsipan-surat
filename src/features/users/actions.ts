'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function updateUserRole(userId: string, newRole: 'CABANG' | 'GA_STAFF' | 'GA_MANAGER') {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    // In a production app, you would check if session.user has Admin privileges here.
    // For this template setup, we'll allow the action to proceed so the user can configure their test accounts.

    await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
    revalidatePath('/dashboard/users');
}
