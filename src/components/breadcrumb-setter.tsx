'use client';

import { useEffect } from 'react';
import { breadcrumbStore } from '@/store/breadcrumb-store';

export function BreadcrumbSetter({ title }: { title: string }) {
    useEffect(() => {
        breadcrumbStore.setTitle(title);
        return () => {
            breadcrumbStore.setTitle(null); // Clean up on unmount
        };
    }, [title]);

    return null;
}
