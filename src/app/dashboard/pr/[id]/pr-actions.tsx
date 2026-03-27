'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { approvePurchaseRequest, rejectPurchaseRequest } from '@/features/pr/actions';
import { toast } from 'sonner';

interface PRActionButtonsProps {
    prId: string;
    status: string;
    userRole: string;
}

export function PRActionButtons({ prId, status, userRole }: PRActionButtonsProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Determine if the current user role is the one expected to approve this PR right now
    const canApprove = (
        (status === 'PENDING_MANAGER' && userRole === 'MANAGER') ||
        (status === 'PENDING_FINANCE' && userRole === 'FINANCE') ||
        (status === 'PENDING_VP' && userRole === 'VP')
    );

    if (!canApprove) return null;

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            await approvePurchaseRequest(prId, 'Approved via Dashboard');
            toast.success('Purchase Request approved.');
        } catch (error: any) {
            toast.error(error.message || 'Failed to approve PR.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        setIsLoading(true);
        try {
            const notes = prompt('Reason for rejection:');
            if (!notes) {
                setIsLoading(false);
                return; // User canceled
            }
            await rejectPurchaseRequest(prId, notes);
            toast.error('Purchase Request rejected.');
        } catch (error: any) {
            toast.error(error.message || 'Failed to reject PR.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleReject} disabled={isLoading}>
                Reject
            </Button>
            <Button onClick={handleApprove} disabled={isLoading}>
                Approve Request
            </Button>
        </div>
    );
}
