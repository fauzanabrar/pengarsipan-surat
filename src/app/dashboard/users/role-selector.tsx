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
        } catch (error: any) {
            toast.error(error.message || 'Failed to update user role');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Select defaultValue={currentRole} onValueChange={handleRoleChange} disabled={isLoading}>
            <SelectTrigger className="w-[140px]">
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
