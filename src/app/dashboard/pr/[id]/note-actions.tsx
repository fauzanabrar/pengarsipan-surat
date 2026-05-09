'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Save, X } from 'lucide-react';
import { updatePRField, updateLogNote } from '@/features/pr/actions';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface PRNoteActionsProps {
    prId: string;
    field: string;
    initialValue: string | null;
    canEdit: boolean;
}

export function PREditableNote({ prId, field, initialValue, canEdit }: PRNoteActionsProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue || '');
    const [isLoading, setIsLoading] = useState(false);

    if (!canEdit && !initialValue) return null;

    if (!isEditing) {
        return (
            <div className="group/note relative">
                <p className="text-muted-foreground bg-muted/30 p-3 rounded-md border-l-2 border-primary min-h-[3rem]">
                    {initialValue || <span className="italic opacity-50">Tidak ada keterangan</span>}
                </p>
                {canEdit && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-7 w-7 transition-opacity"
                        onClick={() => setIsEditing(true)}
                    >
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        );
    }

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updatePRField(prId, field, value, `Mengubah keterangan: ${field}`);
            toast.success('Keterangan berhasil diperbarui');
            setIsEditing(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-2 mt-2">
            <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Tulis keterangan..."
                className="min-h-[100px]"
                autoFocus
            />
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isLoading}>
                    <X className="h-3.5 w-3.5 mr-1" /> Batal
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isLoading}>
                    <Save className="h-3.5 w-3.5 mr-1" /> Simpan
                </Button>
            </div>
        </div>
    );
}

interface PRStatusNoteProps {
    prId: string;
    logId: string;
    initialValue: string | null;
    canEdit: boolean;
}

export function PREditableStatusNote({ prId, logId, initialValue, canEdit }: PRStatusNoteProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue || '');
    const [isLoading, setIsLoading] = useState(false);

    if (!isEditing) {
        return (
            <div className="group/note relative">
                <p className="text-xs opacity-90 pl-6">
                    {initialValue || <span className="italic opacity-50">Tidak ada alasan</span>}
                </p>
                {canEdit && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-1 right-1 h-6 w-6 transition-opacity"
                        onClick={() => setIsEditing(true)}
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                )}
            </div>
        );
    }

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateLogNote(logId, prId, value);
            toast.success('Alasan berhasil diperbarui');
            setIsEditing(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-2 mt-2 pl-6">
            <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Tulis alasan..."
                className="min-h-[80px] text-xs"
                autoFocus
            />
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="xs" className="h-7 text-[10px]" onClick={() => setIsEditing(false)} disabled={isLoading}>
                    Batal
                </Button>
                <Button size="xs" className="h-7 text-[10px]" onClick={handleSave} disabled={isLoading}>
                    Simpan
                </Button>
            </div>
        </div>
    );
}
