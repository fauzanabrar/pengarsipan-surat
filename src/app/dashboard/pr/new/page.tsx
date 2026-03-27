'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createPurchaseRequest } from '@/features/pr/actions';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

export default function NewPRPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState([{ name: '', quantity: 1, price: 0 }]);

    const handleAddItem = () => setItems([...items, { name: '', quantity: 1, price: 0 }]);
    const handleRemoveItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
    const handleItemChange = (idx: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const pr = await createPurchaseRequest(title, description, items);
            toast.success('Purchase Request submitted for tracking!');
            router.push(`/dashboard/pr/${pr.id}`);
        } catch (err: any) {
            toast.error(err.message || 'Failed to create PR');
        } finally {
            setIsLoading(false);
        }
    };

    const totalCost = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="max-w-4xl mx-auto p-8 pt-6 space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Create Purchase Request</h2>
                <p className="text-muted-foreground mt-2">Submit a new request to track through the approval queue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-lg p-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g., MacBook Pro for Engineering" />
                    </div>
                    <div className="space-y-2">
                        <Label>Business Justification</Label>
                        <Textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="Explain why this represents a valid business expense." />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-semibold">Items Requested</h3>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                            <Plus className="h-4 w-4 mr-2" /> Add Item
                        </Button>
                    </div>

                    {items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-end">
                            <div className="flex-1 space-y-2">
                                <Label>Item Name</Label>
                                <Input required value={item.name} onChange={e => handleItemChange(idx, 'name', e.target.value)} />
                            </div>
                            <div className="w-24 space-y-2">
                                <Label>Qty</Label>
                                <Input type="number" min="1" required value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value))} />
                            </div>
                            <div className="w-32 space-y-2">
                                <Label>Unit Price ($)</Label>
                                <Input type="number" min="0" step="0.01" required value={item.price} onChange={e => handleItemChange(idx, 'price', parseFloat(e.target.value))} />
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="text-destructive mb-0.5" onClick={() => handleRemoveItem(idx)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    
                    <div className="text-right text-lg font-bold border-t pt-4">
                        Estimated Total: ${totalCost.toLocaleString()}
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
                    <Button type="submit" disabled={isLoading || items.length === 0}>Submit Request</Button>
                </div>
            </form>
        </div>
    );
}
