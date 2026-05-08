import { Badge } from '@/components/ui/badge';

export function PRStatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'DITERIMA':
            return <Badge className="bg-green-500 hover:bg-green-600 shadow-sm">Diterima</Badge>;
        case 'DITOLAK':
            return <Badge variant="destructive" className="shadow-sm">Ditolak</Badge>;
        case 'MENUNGGU_RAB':
            return <Badge className="bg-blue-500 hover:bg-blue-600 font-medium text-white shadow-sm">Menunggu RAB</Badge>;
        case 'MENUNGGU_PR':
            return <Badge className="bg-purple-500 hover:bg-purple-600 font-medium text-white shadow-sm">Menunggu PR</Badge>;
        case 'MENUNGGU_DIVERIFIKASI':
            return <Badge className="bg-orange-500 hover:bg-orange-600 font-medium text-white shadow-sm">Menunggu Diverifikasi</Badge>;
        default:
            return (
                <Badge variant="outline" className="shadow-sm">
                    {status.replace(/_/g, ' ')}
                </Badge>
            );
    }
}
