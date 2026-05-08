'use client';

import { usePathname } from 'next/navigation';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import React from 'react';

const routeMap: Record<string, string> = {
    dashboard: 'Dashboard',
    pr: 'Pengadaan Barang Jasa',
    users: 'User Roles',
    profile: 'Profile',
    settings: 'Settings',
    new: 'New Request',
};

export function DynamicBreadcrumb() {
    const pathname = usePathname();
    const allPaths = pathname.split('/').filter(Boolean);
    
    // If the first path is 'dashboard' and there are more paths, we can skip the 'dashboard' prefix
    // to make it more concise (e.g., just "Purchase Requests" instead of "Dashboard > Purchase Requests")
    const paths = (allPaths.length > 1 && allPaths[0] === 'dashboard') 
        ? allPaths.slice(1) 
        : allPaths;

    // If we are just at /dashboard, show "Overview"
    if (allPaths.length === 1 && allPaths[0] === 'dashboard') {
        return (
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Overview</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        );
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {paths.map((path, index) => {
                    // Reconstruct the href carefully based on whether we skipped 'dashboard'
                    const fullPaths = (allPaths.length > 1 && allPaths[0] === 'dashboard')
                        ? ['dashboard', ...paths.slice(0, index + 1)]
                        : paths.slice(0, index + 1);
                        
                    const href = `/${fullPaths.join('/')}`;
                    const isLast = index === paths.length - 1;
                    
                    const label = routeMap[path] || path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                    return (
                        <React.Fragment key={path}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}

