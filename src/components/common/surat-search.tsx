'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

interface SuratSearchProps {
    q: string | null;
    sort: string;
    order: 'asc' | 'desc';
}

export function SuratSearch({ q, sort, order }: SuratSearchProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(q || '');

    useEffect(() => {
        setSearchValue(q || '');
    }, [q]);

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            params.set('page', '1');
            return params.toString();
        },
        [searchParams]
    );

    const handleSearch = () => {
        router.push(`${pathname}?${createQueryString('q', searchValue)}`);
    };

    const handleClear = () => {
        setSearchValue('');
        router.push(`${pathname}?${createQueryString('q', '')}`);
    };

    return (
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    type="text"
                    placeholder="Cari nomor, perihal, atau pengirim..."
                    className="pl-9 pr-8 h-9 text-sm bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSearch();
                        }
                    }}
                />
                {searchValue && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
            <Button 
                variant="secondary" 
                size="sm" 
                className="h-9 px-4 font-medium hidden sm:flex"
                onClick={handleSearch}
            >
                Cari
            </Button>
        </div>
    );
}
