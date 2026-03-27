import { Home, Database, Settings, Box, User, FileText, LayoutDashboard, Server, Mail, MessageCircle, Kanban, Calendar, BarChart3, Users, ShoppingCart, Receipt } from "lucide-react"

export interface SidebarSubItem {
    title: string;
    url: string;
}

export interface SidebarItem {
    title: string;
    url?: string;
    icon?: any;
    items?: SidebarSubItem[];
}

export interface SidebarGroup {
    title: string;
    type: string;
    items: SidebarItem[];
}

export const sidebarGroups: SidebarGroup[] = [
    {
        title: "Main",
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
        title: "Analytics & Insights",
        type: "group",
        items: [
            {
                title: "Analytics",
                url: "/dashboard/analytics",
                icon: BarChart3,
            },
            {
                title: "Statistics",
                url: "/dashboard/statistics",
                icon: LayoutDashboard,
            },
        ]
    },
    {
        title: "Content & Operations",
        type: "group",
        items: [
            {
                title: "Purchase Requests",
                url: "/dashboard/pr",
                icon: Receipt,
            },
            {
                title: "Customers",
                url: "/dashboard/customers",
                icon: Users,
            },
            {
                title: "Sales",
                url: "/dashboard/sales",
                icon: ShoppingCart,
            },
        ]
    },
    {
        title: "Workspace Apps",
        type: "group",
        items: [
            {
                title: "Email",
                url: "/dashboard/apps/email",
                icon: Mail,
            },
            {
                title: "Chat",
                url: "/dashboard/apps/chat",
                icon: MessageCircle,
            },
            {
                title: "Kanban",
                url: "/dashboard/apps/kanban",
                icon: Kanban,
            },
            {
                title: "Calendar",
                url: "/dashboard/apps/calendar",
                icon: Calendar,
            },
        ]
    },
    {
        title: "Development",
        type: "group",
        items: [
            {
                title: "Database",
                icon: Database,
                items: [
                    { title: "All Tables", url: "/dashboard/database" },
                    { title: "Query Editor", url: "/dashboard/database/query" },
                    { title: "Migrations", url: "/dashboard/database/migrations" },
                ]
            },
            {
                title: "Components",
                url: "/dashboard/components",
                icon: Box,
            },
            {
                title: "API Keys",
                url: "/dashboard/api-keys",
                icon: Server,
            }
        ]
    },
    {
        title: "Account",
        type: "group",
        items: [
            {
                title: "User Roles",
                url: "/dashboard/users",
                icon: Users,
            },
            {
                title: "Profile",
                url: "/dashboard/profile",
                icon: User,
            },
            {
                title: "Settings",
                url: "/dashboard/settings",
                icon: Settings,
            },
            {
                title: "Documentation",
                url: "/docs",
                icon: FileText,
            },
        ]
    }
]
