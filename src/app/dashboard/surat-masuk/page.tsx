import { auth } from '@/auth';
import { SuratDialog } from '@/features/surat/components/surat-dialog';
import { Suspense } from 'react';
import { SuratTableList } from '@/features/surat/components/surat-table-list';
import { SuratTableSkeleton } from '@/features/surat/components/surat-table-skeleton';

export const dynamic = 'force-dynamic';

export default async function SuratMasukPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    if (!session?.user) return null;

    const resolvedSearchParams = await searchParams;

    return (
        <div className="flex-1 space-y-4 p-0 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 sm:px-4">
                <div className="space-y-0.5">
                    <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground">Surat Masuk</h2>
                </div>
                <div className="w-full sm:w-auto flex justify-end">
                    <SuratDialog type="MASUK" />
                </div>
            </div>

            <div className="px-2 sm:px-4 pb-8">
                <Suspense 
                    key={JSON.stringify(resolvedSearchParams)} 
                    fallback={<SuratTableSkeleton />}
                >
                    <SuratTableList type="MASUK" searchParams={resolvedSearchParams} />
                </Suspense>
            </div>
        </div>
    );
}
