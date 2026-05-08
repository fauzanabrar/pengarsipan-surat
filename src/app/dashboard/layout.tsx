import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/common/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import { auth } from "@/auth"
import { UserNav } from "@/components/user-nav"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()
    if (!session?.user) return null

    const user = session.user;

    return (
        <SidebarProvider>
            <AppSidebar user={user as any} />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background z-10">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <DynamicBreadcrumb />
                    </div>
                    <div className="flex items-center gap-4">
                        <UserNav user={user as any} />
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-4 md:p-6 bg-muted/20">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}
