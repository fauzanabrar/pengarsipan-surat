"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

export function PRFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentQuery = searchParams.get('q') || '';
    const [searchTerm, setSearchTerm] = useState(currentQuery);
    const currentStatus = searchParams.get('status') || 'ALL';

    // Update search term when URL changes (e.g. back button)
    useEffect(() => {
        setSearchTerm(currentQuery);
    }, [currentQuery]);

    // Handle debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== (searchParams.get('q') || '')) {
                handleSearch(searchTerm);
            }
        }, 400);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    };

    const handleStatusChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== 'ALL') {
            params.set('status', value);
        } else {
            params.delete('status');
        }
        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    };

    return (
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari pengadaan, nama, atau cabang..."
                    className="pl-9 bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select defaultValue={currentStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background">
                    <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="MENUNGGU_RAB">Menunggu RAB</SelectItem>
                    <SelectItem value="MENUNGGU_PR">Menunggu PR</SelectItem>
                    <SelectItem value="MENUNGGU_DIVERIFIKASI">Menunggu Verifikasi</SelectItem>
                    <SelectItem value="DITERIMA">Diterima</SelectItem>
                    <SelectItem value="DITOLAK">Ditolak</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
