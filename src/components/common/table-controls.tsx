'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TablePaginationProps {
    totalItems: number;
    pageSize: number;
    currentPage: number;
}

export function TablePagination({ totalItems, pageSize, currentPage }: TablePaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) return null;

    const createPageUrl = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const navigateToPage = (pageNumber: number) => {
        router.push(createPageUrl(pageNumber));
    };

    return (
        <div className="flex items-center justify-between px-2">
            <div className="flex-1 text-sm text-muted-foreground font-medium">
                Menampilkan <span className="text-foreground">{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</span> - <span className="text-foreground">{Math.min(currentPage * pageSize, totalItems)}</span> dari <span className="text-foreground">{totalItems}</span> surat
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 hidden sm:flex"
                    onClick={() => navigateToPage(1)}
                    disabled={currentPage <= 1}
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigateToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                    <div className="flex h-8 min-w-[32px] items-center justify-center rounded-md border bg-background px-3 text-sm font-bold text-primary shadow-sm">
                        {currentPage}
                    </div>
                    <span className="text-sm text-muted-foreground px-1 font-medium">dari {totalPages}</span>
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigateToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 hidden sm:flex"
                    onClick={() => navigateToPage(totalPages)}
                    disabled={currentPage >= totalPages}
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

interface TableSortHeaderProps {
    label: string;
    field: string;
    currentSort?: string;
    currentOrder?: 'asc' | 'desc';
    className?: string;
    icon?: React.ReactNode;
}

export function TableSortHeader({ label, field, currentSort, currentOrder, className, icon }: TableSortHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isSorted = currentSort === field;
    
    const toggleSort = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (isSorted) {
            if (currentOrder === 'desc') {
                params.set('order', 'asc');
            } else {
                params.set('order', 'desc');
            }
        } else {
            params.set('sort', field);
            params.set('order', 'desc');
        }
        params.set('page', '1'); // Reset to first page on sort
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <button
            onClick={toggleSort}
            className={cn(
                "flex items-center gap-1 hover:text-primary transition-colors focus:outline-none group",
                isSorted && "text-primary",
                className
            )}
        >
            {icon && icon}
            <span className="text-start">{label}</span>
            <div className="flex flex-col flex-shrink-0">
                {isSorted ? (
                    currentOrder === 'asc' ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />
                ) : (
                    <ArrowUpDown className="h-2.5 w-2.5 opacity-20 group-hover:opacity-100" />
                )}
            </div>
        </button>
    );
}
