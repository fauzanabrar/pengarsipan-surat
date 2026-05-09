'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ReceiptText, Trash2, Plus } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { RABItem, CATEGORIES } from '../types';

interface RABItemEditorProps {
    items: RABItem[];
    onChange: (items: RABItem[]) => void;
}

export function RABItemEditor({ items, onChange }: RABItemEditorProps) {
    const [bulkInput, setBulkInput] = useState("");
    const [showBulkAdd, setShowBulkAdd] = useState(false);

    const updateItem = (index: number, field: keyof RABItem, value: string | number) => {
        const newItems = items.map((item, i) => i === index ? { ...item, [field]: value } : item) as RABItem[];
        onChange(newItems);
    };

    const removeItem = (index: number) => {
        if (items.length <= 1) return;
        onChange(items.filter((_, i) => i !== index));
    };

    const addItem = () => {
        onChange([...items, { name: '', category: 'Elektronik', quantity: 1, price: '' }]);
    };

    const handleBulkAdd = () => {
        const lines = bulkInput.split('\n').filter(line => line.trim() !== '');
        const newItems: RABItem[] = lines.map(line => {
            const parts = line.split(/[,;\t]/).map(p => p.trim());
            return {
                name: parts[0] || 'Item Baru',
                category: (CATEGORIES as any).includes(parts[1]) ? parts[1] as any : 'Lainnya',
                quantity: parseInt(parts[2]) || 1,
                price: parts[3]?.replace(/[^0-9]/g, '') || '0'
            };
        });
        
        onChange([...items.filter(i => i.name.trim() !== ''), ...newItems]);
        setBulkInput("");
        setShowBulkAdd(false);
        toast.success(`${newItems.length} item berhasil ditambahkan`);
    };

    return (
        <div className="space-y-4">
            <Label className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold"><ReceiptText className="h-4 w-4" /> Item Rincian RAB</div>
                <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold" onClick={() => setShowBulkAdd(!showBulkAdd)}>
                    {showBulkAdd ? 'Tutup Bulk Add' : 'Tambah Banyak (Bulk)'}
                </Button>
            </Label>

            {showBulkAdd && (
                <div className="space-y-2 p-3 bg-muted/50 border rounded-md">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Format: Nama Item, Kategori, Qty, Harga</Label>
                    <Textarea 
                        placeholder="Contoh:&#10;Laptop, Elektronik, 2, 15000000&#10;Kursi, Funitur, 10, 500000" 
                        rows={4} 
                        className="text-xs font-mono"
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                    />
                    <Button type="button" size="sm" className="w-full text-xs h-8" onClick={handleBulkAdd} disabled={!bulkInput.trim()}>
                        Proses & Tambah ke Daftar
                    </Button>
                </div>
            )}

            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-3 border p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors relative group">
                        <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Nama Barang/Jasa</Label>
                                <Input className="h-9" placeholder="Nama item" value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} />
                            </div>
                            <div className="w-[160px] space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Kategori</Label>
                                <Select value={item.category} onValueChange={(val) => updateItem(idx, 'category', val)}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Pilih" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="ghost" size="icon" className="text-destructive h-9 w-9 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex gap-3 items-end">
                            <div className="w-20 space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Qty</Label>
                                <Input className="h-9" type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value))} />
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Harga Satuan</Label>
                                <Input className="h-9" type="number" placeholder="Harga" value={item.price} onChange={(e) => updateItem(idx, 'price', e.target.value)} />
                            </div>
                            <div className="w-[120px] space-y-1.5 text-right">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Subtotal</Label>
                                <div className="h-9 flex items-center justify-end px-3 bg-background border rounded-md font-bold text-xs tabular-nums">
                                    {new Intl.NumberFormat('id-ID').format(Number(item.price || 0) * item.quantity)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="w-full gap-2 h-9 border-dashed hover:border-primary hover:text-primary transition-all" onClick={addItem}>
                    <Plus className="h-4 w-4" /> Tambah Baris Baru
                </Button>
            </div>
        </div>
    );
}
