import { Home, Settings, User, Users, Inbox, Send, List, ListChecks } from "lucide-react"

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
                icon: Send,
            },
        ]
    },
    {
        title: "Administrator",
        type: "group",
        items: [
            {
                title: "Pengaturan",
                url: "/dashboard/settings",
                icon: Settings,
                isAdminOnly: true,
            },
        ]
    },
    {
        title: "Pengguna",
        type: "group",
        items: [
            {
                title: "Profil",
                url: "/dashboard/profile",
                icon: User,
            },
        ]
    }
]
