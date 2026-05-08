import { Badge } from '@/components/ui/badge';

export function PRStatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'PENDING_GAMBAR':
            return <Badge className="bg-blue-400 hover:bg-blue-500 font-medium text-white shadow-sm border-none">Menunggu Gambar</Badge>;
        case 'PENDING_RAB':
            return <Badge className="bg-blue-600 hover:bg-blue-700 font-medium text-white shadow-sm border-none">Menunggu RAB</Badge>;
        case 'PENDING_GA_MANAGER':
            return <Badge className="bg-orange-500 hover:bg-orange-600 font-medium text-white shadow-sm border-none">Menunggu Approval GA Manager</Badge>;
        case 'PENDING_CABANG_PR':
            return <Badge className="bg-purple-500 hover:bg-purple-600 font-medium text-white shadow-sm border-none">Menunggu PR Cabang</Badge>;
        case 'PENDING_VERIFIKASI':
            return <Badge className="bg-indigo-500 hover:bg-indigo-600 font-medium text-white shadow-sm border-none">Menunggu Verifikasi</Badge>;
        case 'PENDING_PENGADAAN':
            return <Badge className="bg-cyan-500 hover:bg-cyan-600 font-medium text-white shadow-sm border-none">Proses Pengadaan</Badge>;
        case 'COMPLETED':
            return <Badge className="bg-green-500 hover:bg-green-600 font-medium text-white shadow-sm border-none">Selesai</Badge>;
        case 'REJECTED':
            return <Badge variant="destructive" className="font-medium shadow-sm">Ditolak</Badge>;
        case 'REVISION':
            return <Badge variant="secondary" className="font-medium shadow-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">Revisi</Badge>;
        default:
            return (
                <Badge variant="outline" className="shadow-sm">
                    {status.replace(/_/g, ' ')}
                </Badge>
            );
    }
}
