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

    const handleRoleChange = async (newRole: "EMPLOYEE" | "MANAGER" | "FINANCE" | "VP") => {
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
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="FINANCE">Finance</SelectItem>
                <SelectItem value="VP">Executive (VP)</SelectItem>
            </SelectContent>
        </Select>
    );
}
