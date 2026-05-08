import { Home, Settings, User, Users, ShoppingCart } from "lucide-react"

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
        title: "Overview",
        type: "group",
        items: [
            {
                title: "Dashboard",
                url: "/dashboard",
                icon: Home,
            },
        ]
    },
    {
        title: "Asset Management",
        type: "group",
        items: [
            {
                title: "Pengadaan Barang Jasa",
                url: "/dashboard/pr",
                icon: ShoppingCart,
            },
        ]
    },
    {
        title: "Administration",
        type: "group",
        items: [
            {
                title: "User Roles",
                url: "/dashboard/users",
                icon: Users,
                isAdminOnly: true,
            },
        ]
    },
    {
        title: "Settings",
        type: "group",
        items: [
            {
                title: "Profile",
                url: "/dashboard/profile",
                icon: User,
            },
            {
                title: "System Settings",
                url: "/dashboard/settings",
                icon: Settings,
            },
        ]
    }
]

