import { Badge } from '@/components/ui/badge';

export function PRStatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'COMPLETED':
            return <Badge className="bg-green-500 hover:bg-green-600 shadow-sm">Completed</Badge>;
        case 'REJECTED':
            return <Badge variant="destructive" className="shadow-sm">Rejected</Badge>;
        case 'REVISION':
            return <Badge variant="secondary" className="shadow-sm">Revision Required</Badge>;
        case 'PENDING_GAMBAR':
            return <Badge className="bg-blue-500 hover:bg-blue-600 font-medium text-white shadow-sm">Pending Gambar</Badge>;
        case 'PENDING_RAB':
            return <Badge className="bg-blue-500 hover:bg-blue-600 font-medium text-white shadow-sm">Pending RAB</Badge>;
        case 'PENDING_GA_MANAGER':
            return <Badge className="bg-purple-500 hover:bg-purple-600 font-medium text-white shadow-sm">Pending GA Manager</Badge>;
        case 'PENDING_CABANG_PR':
            return <Badge className="bg-orange-500 hover:bg-orange-600 font-medium text-white shadow-sm">Pending Cabang PR</Badge>;
        case 'PENDING_VERIFIKASI':
            return <Badge className="bg-cyan-500 hover:bg-cyan-600 font-medium text-white shadow-sm">Pending Verifikasi</Badge>;
        case 'PENDING_PENGADAAN':
            return <Badge className="bg-indigo-500 hover:bg-indigo-600 font-medium text-white shadow-sm">Pending Pengadaan</Badge>;
        default:
            return (
                <Badge variant="outline" className="shadow-sm">
                    {status.replace(/_/g, ' ')}
                </Badge>
            );
    }
}
