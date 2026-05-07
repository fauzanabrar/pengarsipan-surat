"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { logout } from "@/lib/actions"
import { LogOut, User, Settings, ChevronDown } from "lucide-react"
import { useTransition } from "react"

interface UserNavProps {
    user: {
        name?: string | null
        email?: string | null
    }
}

export function UserNav({ user }: UserNavProps) {
    const [isPending, startTransition] = useTransition()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center gap-3 px-3 py-2 h-auto rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
                    disabled={isPending}
                >
                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                        <AvatarFallback className="bg-gradient-to-tr from-green-500 to-emerald-600 text-white font-bold text-base">
                            {user.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold hidden md:block">{user.name || 'User'}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email || 'user@example.com'}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <a href="/dashboard/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a href="/dashboard/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
                    disabled={isPending}
                    onClick={() => {
                        startTransition(async () => {
                            await logout()
                        })
                    }}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isPending ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
