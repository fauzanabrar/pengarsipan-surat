import { FileText } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
} from "@/components/ui/sidebar"
import { sidebarGroups } from "@/lib/navigation"
import { SidebarItem } from "./sidebar_item"

interface AppSidebarProps {
    user?: {
        name?: string | null;
        email?: string | null;
    }
}

export function AppSidebar({ user }: AppSidebarProps) {
    return (
        <Sidebar className="border-r-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-2xl shadow-xl transition-all duration-300">
            <SidebarHeader className="h-16 flex items-center justify-center border-b border-black/5 dark:border-white/5 px-6">
                <div className="flex items-center gap-3 w-full">
                    <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-green-500 shadow-lg shadow-primary/20 shrink-0">
                        <FileText className="h-5 w-5 text-white stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col leading-none justify-center">
                        <span className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                            Pengarsipan Surat
                        </span>
                        <span className="text-base font-black bg-gradient-to-br from-primary to-green-500 bg-clip-text text-transparent">
                            KALLA TOYOTA
                        </span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent className="px-0 py-1 gap-0">
                {sidebarGroups.map((group, index) => (
                    <SidebarGroup key={index} className="!p-0 !m-0">
                        <SidebarGroupLabel className="!h-5 !py-0 px-6 text-xs font-bold text-foreground uppercase tracking-widest opacity-80">
                            {group.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-0 space-y-0 w-full">
                                {group.items.map((item) => (
                                    <SidebarItem key={item.title} item={item} />
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
        </Sidebar>
    )
}
