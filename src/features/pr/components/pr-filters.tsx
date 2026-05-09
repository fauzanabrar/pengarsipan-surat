"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState, useEffect, useCallback } from "react";

export function PRFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const currentQuery = searchParams.get('q') || '';
    const [searchTerm, setSearchTerm] = useState(currentQuery);
    const currentStatus = searchParams.get('status') || 'ALL';

    // Update search term when URL changes (e.g. back button)
    useEffect(() => {
        setSearchTerm(currentQuery);
    }, [currentQuery]);

    // Handle debounced search
    const handleSearch = useCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        params.set('page', '1'); // Reset pagination on search
        
        router.push(`${pathname}?${params.toString()}`, {
            scroll: false,
        });
    }, [searchParams, pathname, router]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== (searchParams.get('q') || '')) {
                handleSearch(searchTerm);
            }
        }, 400);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, searchParams, handleSearch]);

    const handleStatusChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== 'ALL') {
            params.set('status', value);
        } else {
            params.delete('status');
        }
        params.set('page', '1'); // Reset pagination on filter
        
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-48 lg:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                    placeholder="Cari judul, pengaju..."
                    className="pl-8 bg-background h-8 text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select defaultValue={currentStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-[160px] bg-background h-8 text-xs">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                    <SelectItem value="PENDING_GAMBAR" className="text-xs">Pending Gambar</SelectItem>
                    <SelectItem value="PENDING_RAB" className="text-xs">Pending RAB</SelectItem>
                    <SelectItem value="PENDING_GA_MANAGER" className="text-xs">Approval Manager</SelectItem>
                    <SelectItem value="PENDING_CABANG_PR" className="text-xs">Upload PR Cabang</SelectItem>
                    <SelectItem value="PENDING_VERIFIKASI" className="text-xs">Verifikasi Spesifikasi</SelectItem>
                    <SelectItem value="PENDING_PENGADAAN" className="text-xs">Proses Pengadaan</SelectItem>
                    <SelectItem value="REVISION" className="text-xs">Revisi</SelectItem>
                    <SelectItem value="REJECTED" className="text-xs">Ditolak</SelectItem>
                    <SelectItem value="COMPLETED" className="text-xs">Selesai</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
