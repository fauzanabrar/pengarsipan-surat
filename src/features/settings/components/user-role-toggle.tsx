'use client';

import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { updateUserRole } from "../actions";
import { toast } from "sonner";
import { useState } from "react";

interface UserRoleToggleProps {
    userId: string;
    currentRole: 'ADMIN' | 'USER';
    isMe: boolean;
}

export function UserRoleToggle({ userId, currentRole, isMe }: UserRoleToggleProps) {
    const [isLoading, setIsLoading] = useState(false);

    async function handleRoleChange(newRole: 'ADMIN' | 'USER') {
        if (isMe) {
            toast.error("Anda tidak dapat mengubah peran Anda sendiri");
            return;
        }

        try {
            setIsLoading(true);
            await updateUserRole(userId, newRole);
            toast.success("Peran pengguna berhasil diperbarui");
        } catch (error) {
            toast.error("Gagal memperbarui peran");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Select 
            defaultValue={currentRole} 
            onValueChange={(v) => handleRoleChange(v as 'ADMIN' | 'USER')}
            disabled={isLoading || isMe}
        >
            <SelectTrigger className="h-8 w-[100px] text-xs">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="USER">USER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
            </SelectContent>
        </Select>
    );
}
