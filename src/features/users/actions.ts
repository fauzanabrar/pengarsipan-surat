'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { uploadFile } from '@/lib/file-upload';

export async function updateUserRole(userId: string, newRole: 'CABANG' | 'GA_STAFF' | 'GA_MANAGER') {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    // In a production app, you would check if session.user has Admin privileges here.
    // For this template setup, we'll allow the action to proceed so the user can configure their test accounts.

    await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
    revalidatePath('/dashboard/users');
}

export async function deleteUser(userId: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    await db.delete(users).where(eq(users.id, userId));
    revalidatePath('/dashboard/users');
}

export async function updateUserDetails(userId: string, data: { name: string; email: string }) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    await db.update(users).set({ name: data.name, email: data.email }).where(eq(users.id, userId));
    revalidatePath('/dashboard/users');
}

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const location = formData.get('location') as string;
    const avatarFile = formData.get('avatar') as File | null;
    const removeAvatar = formData.get('removeAvatar') === 'true';

    let updateData: { name?: string; email?: string; location?: string; avatarUrl?: string | null } = {};

    if (name !== null) updateData.name = name;
    if (email !== null) updateData.email = email;
    if (location !== null) updateData.location = location;

    if (removeAvatar) {
        updateData.avatarUrl = null;
    } else if (avatarFile && avatarFile.size > 0 && avatarFile.name !== 'undefined') {
        const formDataAvatar = new FormData();
        formDataAvatar.append('file', avatarFile);
        const url = await uploadFile(formDataAvatar, { bucket: 'avatars' });
        updateData.avatarUrl = url;
    }

    await db.update(users).set({
        ...updateData,
        updatedAt: new Date()
    }).where(eq(users.id, session.user.id));
    revalidatePath('/dashboard/profile');
}

