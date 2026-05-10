import { Home, Settings, User, Users, Inbox, Outbox, List, ListChecks } from "lucide-react"

export interface SidebarSubItem {
    title: string;
    url: string;
}

export interface SidebarItem {
    title: string;
    url?: string;
    icon?: any;
    items?: SidebarSubItem[];
    isAdminOnly?: boolean;
}

export interface SidebarGroup {
    title: string;
    type: string;
    items: SidebarItem[];
}

export const sidebarGroups: SidebarGroup[] = [
    {
        title: "Pengarsipan",
        type: "group",
        items: [
            {
                title: "Surat Masuk",
                url: "/dashboard/surat-masuk",
                icon: Inbox,
            },
            {
                title: "Surat Keluar",
                url: "/dashboard/surat-keluar",
                icon: Outbox,
            },
        ]
    },
    {
        title: "Pengaturan",
        type: "group",
        items: [
            {
                title: "Identifikasi",
                url: "/dashboard/identifikasi",
                icon: List,
                isAdminOnly: true,
            },
            {
                title: "Kode Surat",
                url: "/dashboard/kode-surat",
                icon: ListChecks,
                isAdminOnly: true,
            },
            {
                title: "Pengguna",
                url: "/dashboard/users",
                icon: Users,
                isAdminOnly: true,
            },
            {
                title: "Pengaturan Sistem",
                url: "/dashboard/settings",
                icon: Settings,
                isAdminOnly: true,
            },
            {
                title: "Profil",
                url: "/dashboard/profile",
                icon: User,
            },
        ]
    }
]

