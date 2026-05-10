"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from "@/components/ui/sidebar"
import { SidebarItem as SidebarItemType } from "@/lib/navigation"
import { cn } from "@/lib/utils"

interface SidebarItemProps {
    item: SidebarItemType;
}

export function SidebarItem({ item }: SidebarItemProps) {
    const pathname = usePathname()
    const { isMobile, setOpenMobile } = useSidebar()

    const handleNavClick = () => {
        if (isMobile) {
            setOpenMobile(false)
        }
    }

    // Check if pathname starts with the item URL for nested pages
    const isParentActive = item.url && pathname.startsWith(item.url)
    const isExactMatch = pathname === item.url

    if (item.items) {
        return (
            <SidebarMenuItem className="w-full">
                <div className="space-y-0 w-full flex flex-col items-start px-0">
                    <div className={cn(
                        "w-full px-6 py-2 flex items-center gap-3 text-base font-semibold transition-all duration-200 group cursor-pointer",
                        isParentActive 
                            ? "bg-slate-100 text-slate-900 border-l-4 border-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-100" 
                            : "text-foreground/70 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 border-l-4 border-transparent"
                    )}>
                        {item.icon && <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />}
                        <span className="transition-transform duration-200 group-hover:translate-x-1">{item.title}</span>
                    </div>
                    {isParentActive && (
                        <SidebarMenuSub className="space-y-1 pl-14 border-l-0 px-0 mx-0 mt-0 pb-1">
                            {item.items.map((subItem) => {
                                const isSubActive = pathname === subItem.url;
                                return (
                                    <SidebarMenuSubItem key={subItem.title}>
                                        <Link href={subItem.url} onClick={handleNavClick} className={cn(
                                            "text-sm font-medium transition-colors hover:text-slate-900 dark:hover:text-slate-100 block py-0.5",
                                            isSubActive ? "text-slate-900 dark:text-slate-100 font-bold" : "text-muted-foreground"
                                        )}>
                                            {subItem.title}
                                        </Link>
                                    </SidebarMenuSubItem>
                                );
                            })}
                        </SidebarMenuSub>
                    )}
                </div>
            </SidebarMenuItem>
        )
    }

    return (
        <SidebarMenuItem className="w-full">
            <Link href={item.url || "#"} onClick={handleNavClick} className={cn(
                "w-full px-6 py-2 flex items-center gap-3 text-base font-semibold transition-all duration-200 group",
                isExactMatch 
                    ? "bg-slate-100 text-slate-900 border-l-4 border-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-100" 
                    : "text-foreground/70 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 border-l-4 border-transparent"
            )}>
                {item.icon && <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />}
                <span className="transition-transform duration-200 group-hover:translate-x-1">{item.title}</span>
            </Link>
        </SidebarMenuItem>
    )
}
