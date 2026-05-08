'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RoleSelector } from './role-selector';
import { Mail, Search, Edit2, Trash2, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { deleteUser, updateUserDetails } from '@/features/users/actions';
import { toast } from 'sonner';

type User = {
    id: string;
    name: string | null;
    email: string | null;
    username: string;
    createdAt: Date;
    role: string;
};

type SortColumn = 'user' | 'contact' | 'registered' | 'role' | null;
type SortDirection = 'asc' | 'desc';

export function UserClientTable({ initialUsers }: { initialUsers: User[] }) {
    const [page, setPage] = useState(1);
    
    // Sorting State
    const [sortColumn, setSortColumn] = useState<SortColumn>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    
    // Action Modals State
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const limit = 5;

    const sortedUsers = useMemo(() => {
        const result = [...initialUsers];

        // Sort
        if (sortColumn) {
            result.sort((a, b) => {
                let aVal: string | number = '';
                let bVal: string | number = '';

                switch (sortColumn) {
                    case 'user':
                        aVal = (a.name || a.username).toLowerCase();
                        bVal = (b.name || b.username).toLowerCase();
                        break;
                    case 'contact':
                        aVal = (a.email || '').toLowerCase();
                        bVal = (b.email || '').toLowerCase();
                        break;
                    case 'registered':
                        aVal = new Date(a.createdAt).getTime();
                        bVal = new Date(b.createdAt).getTime();
                        break;
                    case 'role':
                        aVal = a.role;
                        bVal = b.role;
                        break;
                }

                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [initialUsers, sortColumn, sortDirection]);

    const totalPages = Math.ceil(sortedUsers.length / limit) || 1;
    const paginatedUsers = sortedUsers.slice((page - 1) * limit, page * limit);

    // Ensure we don't end up on an empty page if items are deleted/filtered
    if (page > totalPages && totalPages > 0) {
        setPage(totalPages);
    }

    const openEditModal = (user: User) => {
        setUserToEdit(user);
        setEditName(user.name || '');
        setEditEmail(user.email || '');
    };

    const handleEditSave = async () => {
        if (!userToEdit) return;
        setIsSaving(true);
        try {
            await updateUserDetails(userToEdit.id, { name: editName, email: editEmail });
            toast.success('User updated successfully');
            setUserToEdit(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update user');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            await deleteUser(userToDelete.id);
            toast.success('User deleted successfully');
            setUserToDelete(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user');
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
        setPage(1);
    };

    const renderSortIcon = (column: SortColumn) => {
        if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-40 hover:opacity-100" />;
        return sortDirection === 'asc' 
            ? <ArrowUp className="ml-2 h-3.5 w-3.5 text-primary" />
            : <ArrowDown className="ml-2 h-3.5 w-3.5 text-primary" />;
    };

    return (
        <div className="space-y-0 w-full overflow-hidden">
            {/* Table wrapper with overflow-x-auto to prevent cutting */}
            <div className="w-full overflow-x-auto">
                <Table className="w-full min-w-[800px]">
                    <TableHeader className="bg-transparent">
                    <TableRow className="hover:bg-transparent border-b border-black/5 dark:border-white/5">
                        <TableHead 
                            className="pl-6 h-14 text-xs font-bold uppercase tracking-widest text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                            onClick={() => toggleSort('user')}
                        >
                            <div className="flex items-center">User {renderSortIcon('user')}</div>
                        </TableHead>
                        <TableHead 
                            className="h-14 text-xs font-bold uppercase tracking-widest text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                            onClick={() => toggleSort('contact')}
                        >
                            <div className="flex items-center">Contact {renderSortIcon('contact')}</div>
                        </TableHead>
                        <TableHead 
                            className="h-14 text-xs font-bold uppercase tracking-widest text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                            onClick={() => toggleSort('registered')}
                        >
                            <div className="flex items-center">Registered {renderSortIcon('registered')}</div>
                        </TableHead>
                        <TableHead 
                            className="h-14 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right cursor-pointer select-none hover:text-foreground transition-colors"
                            onClick={() => toggleSort('role')}
                        >
                            <div className="flex items-center justify-end">System Role {renderSortIcon('role')}</div>
                        </TableHead>
                        <TableHead className="pr-6 w-[120px] h-14 text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedUsers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                No users found matching your criteria.
                            </TableCell>
                        </TableRow>
                    ) : (
                        paginatedUsers.map((u) => (
                            <TableRow key={u.id} className="group transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted border-b border-black/5 dark:border-white/5 last:border-0">
                                <TableCell className="pl-6 py-5 min-w-[200px]">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-11 w-11 border-2 border-primary/10 shadow-sm transition-transform group-hover:scale-105 shrink-0">
                                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-lg">
                                                {(u.name || u.username)[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="font-bold text-[15px] truncate">{u.name || u.username}</span>
                                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                                @{u.username}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-5 min-w-[200px]">
                                    <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                                        <div className="p-1.5 rounded-md bg-muted shrink-0">
                                            <Mail className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="truncate">{u.email || 'No email provided'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-5 text-[13px] font-medium text-muted-foreground whitespace-nowrap min-w-[120px]">
                                    <div className="flex items-center">
                                        <span className="px-2.5 py-1 rounded-full bg-muted/50 border">
                                            {new Date(u.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-5 text-right">
                                    <div className="flex justify-end">
                                        <RoleSelector userId={u.id} currentRole={u.role} />
                                    </div>
                                </TableCell>
                                <TableCell className="pr-6 py-5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                            onClick={() => openEditModal(u)}
                                            title="Edit User"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            onClick={() => setUserToDelete(u)}
                                            title="Delete User"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-black/5 dark:border-white/5 bg-transparent">
                    <span className="text-sm text-muted-foreground">
                        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, sortedUsers.length)} of {sortedUsers.length} entries
                    </span>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!userToEdit} onOpenChange={(open) => !open && setUserToEdit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User Details</DialogTitle>
                        <DialogDescription>
                            Make changes to {userToEdit?.username}&apos;s profile here.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full Name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email Address" type="email" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUserToEdit(null)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleEditSave} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Delete User Account</DialogTitle>
                        <DialogDescription>
                            Are you absolutely sure you want to delete the user <strong>{userToDelete?.username}</strong>? This action cannot be undone and will permanently remove their data from the servers.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setUserToDelete(null)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Confirm Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

