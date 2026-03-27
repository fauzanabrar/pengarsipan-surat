import { Badge } from '@/components/ui/badge';

export function PRStatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'APPROVED':
            return <Badge className="bg-green-500 hover:bg-green-600 shadow-sm">Approved</Badge>;
        case 'REJECTED':
            return <Badge variant="destructive" className="shadow-sm">Rejected</Badge>;
        case 'DRAFT':
            return <Badge variant="secondary" className="shadow-sm">Draft</Badge>;
        default:
            return (
                <Badge className="bg-yellow-500 hover:bg-yellow-600 font-medium text-white shadow-sm">
                    {status.replace('_', ' ')}
                </Badge>
            );
    }
}
