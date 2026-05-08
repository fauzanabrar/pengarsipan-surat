'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateUserRole } from '@/features/users/actions';
import { toast } from 'sonner';

interface RoleSelectorProps {
    userId: string;
    currentRole: string;
}

export function RoleSelector({ userId, currentRole }: RoleSelectorProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleRoleChange = async (newRole: 'CABANG' | 'GA_STAFF' | 'GA_MANAGER') => {
        setIsLoading(true);
        try {
            await updateUserRole(userId, newRole);
            toast.success('User role updated successfully');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to update user role';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Select defaultValue={currentRole} onValueChange={handleRoleChange} disabled={isLoading}>
            <SelectTrigger className="w-[160px] h-10 font-bold bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary transition-all focus:ring-primary/20 shadow-sm">
                <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="CABANG">Cabang</SelectItem>
                <SelectItem value="GA_STAFF">GA Staff</SelectItem>
                <SelectItem value="GA_MANAGER">GA Manager</SelectItem>
            </SelectContent>
        </Select>
    );
}
