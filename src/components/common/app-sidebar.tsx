"use client"

import { LogOut } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { logout } from "@/lib/actions"
import { sidebarGroups } from "@/lib/navigation"
import { SidebarItem } from "@/components/sidebar_item"
import { useTransition } from "react"

interface AppSidebarProps {
    user?: {
        name?: string | null;
        email?: string | null;
    }
}

export function AppSidebar({ user }: AppSidebarProps) {
    const [isPending, startTransition] = useTransition()

    return (
        <Sidebar className="border-r-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-2xl shadow-xl transition-all duration-300">
            <SidebarHeader className="h-16 flex items-center justify-center border-b border-black/5 dark:border-white/5 px-6">
                <span className="text-xl font-bold bg-gradient-to-tr from-primary to-purple-600 bg-clip-text text-transparent">
                    CCR Admin
                </span>
            </SidebarHeader>
            <SidebarContent className="px-4 py-2 gap-2">
                {sidebarGroups.map((group, index) => (
                    <SidebarGroup key={index} className="px-0">
                        <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest mb-1">
                            {group.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-2">
                                {group.items.map((item) => (
                                    <SidebarItem key={item.title} item={item} />
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter className="border-t border-black/5 dark:border-white/5 p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => {
                                startTransition(async () => {
                                    await logout()
                                })
                            }}
                            disabled={isPending}
                            size="lg"
                            className="h-11 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>{isPending ? "Signing Out..." : "Sign Out"}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
