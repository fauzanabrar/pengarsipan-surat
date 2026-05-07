"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GitPullRequest, RotateCcw, Play, FileCode, CheckCircle2, AlertCircle } from "lucide-react"

const migrations = [
    { id: "20241024_101231", name: "add_sessions_table", status: "Applied", batch: 4, date: "2 hours ago" },
    { id: "20241023_154200", name: "fix_user_constraints", status: "Applied", batch: 3, date: "1 day ago" },
    { id: "20241022_092015", name: "seed_initial_departments", status: "Applied", batch: 2, date: "2 days ago" },
    { id: "20241021_180000", name: "initial_schema_setup", status: "Applied", batch: 1, date: "3 days ago" },
]

export default function MigrationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Database Migrations</h2>
                    <p className="text-muted-foreground">Track and manage your schema changes and history.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <RotateCcw className="h-4 w-4" /> Rollback
                    </Button>
                    <Button className="gap-2 shadow-lg bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4" /> Run Pending
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 shadow-md border-none overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle>Migration History</CardTitle>
                            <Badge variant="secondary" className="font-mono text-[10px]">{migrations.length} Entries</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y border-b">
                            {migrations.map((m) => (
                                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold font-mono tracking-tight">{m.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">Batch {m.batch}</span>
                                                <span className="text-[10px] text-muted-foreground italic">{m.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100">View Source</Button>
                                        <Badge className="bg-emerald-500 text-white border-none font-bold text-[9px] uppercase tracking-wider">{m.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="shadow-sm border-none bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                        <CardHeader>
                            <CardTitle className="text-lg">Deployment Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-xs opacity-80 uppercase font-bold tracking-wider">
                                <span>Current Version</span>
                                <span>v2.1.0</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
                                <div className="h-full w-full bg-white" />
                            </div>
                            <p className="text-[10px] font-medium leading-relaxed opacity-70 italic">
                                All migrations have been successfully applied to the production cluster.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500" /> Pending Changes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-8 border-2 border-dashed rounded-xl flex flex-col items-center gap-3 text-center opacity-40">
                                <FileCode className="h-10 w-10" />
                                <span className="text-xs font-medium">No pending migrations found</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
