import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface CardedTableProps {
    title?: string
    description?: string
    headerContent?: ReactNode
    footerContent?: ReactNode
    children: ReactNode
    className?: string
    contentClassName?: string
}

// Lightweight wrapper to keep table cards consistent across dashboard pages.
export function CardedTable({
    title,
    description,
    headerContent,
    footerContent,
    children,
    className,
    contentClassName,
}: CardedTableProps) {
    return (
        <Card className={cn("border-none shadow-md ring-1 ring-black/15 dark:ring-white/10 gap-0 py-0 overflow-hidden", className)}>
            {(title || description || headerContent) && (
                <CardHeader className="px-4 pt-3 pb-4 border-b border-black/5 dark:border-white/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {(title || description) && (
                            <div className="space-y-1 text-start">
                                {title && <CardTitle>{title}</CardTitle>}
                                {description && <CardDescription>{description}</CardDescription>}
                            </div>
                        )}
                        {headerContent && (
                            <div className={cn("w-full", (title || description) ? "md:w-auto" : "")}>
                                {headerContent}
                            </div>
                        )}
                    </div>
                </CardHeader>
            )}
            <CardContent className={cn("p-0 overflow-x-auto", contentClassName)}>
                {children}
            </CardContent>
            {footerContent && (
                <div className="px-4 py-3 border-t border-black/5 dark:border-white/5 bg-muted/20">
                    {footerContent}
                </div>
            )}
        </Card>
    )
}
