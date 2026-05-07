'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createPurchaseRequest } from '@/features/pr/actions';
import { toast } from 'sonner';

export default function NewPRPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const file = fileRef.current?.files?.[0];
            const pr = await createPurchaseRequest(title, description, file);
            toast.success('Purchase Request submitted successfully!');
            router.push(`/dashboard/pr/${pr.id}`);
        } catch (err: any) {
            toast.error(err.message || 'Failed to create PR');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8 pt-6 space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Create Purchase Request</h2>
                <p className="text-muted-foreground mt-2">Submit a new request with Surat Cabang to start the procurement process.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-lg p-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input 
                            id="title"
                            required 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            placeholder="E.g., Pengadaan Komputer Cabang Jakarta" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                            id="description"
                            required 
                            value={description} 
                            onChange={e => setDescription(e.target.value)} 
                            placeholder="Describe the purpose of this purchase request..." 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="surat-cabang">Surat Cabang (Branch Letter)</Label>
                        <Input 
                            id="surat-cabang"
                            type="file" 
                            ref={fileRef}
                            accept=".pdf,.doc,.docx"
                        />
                        <p className="text-xs text-muted-foreground">Upload the approved branch letter document</p>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
