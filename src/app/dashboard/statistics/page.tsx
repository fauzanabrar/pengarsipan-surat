"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, LineChart, PieChart } from "lucide-react"

const data = [
    { name: "Jan", total: 1500 },
    { name: "Feb", total: 2300 },
    { name: "Mar", total: 3200 },
    { name: "Apr", total: 2100 },
    { name: "May", total: 4400 },
    { name: "Jun", total: 3800 },
]

// Format number as Indonesian Rupiah
function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export default function StatisticsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Statistics</h2>
                <p className="text-muted-foreground">Comprehensive insights and key metrics for your platform.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="shadow-lg border-none bg-gradient-to-br from-green-600 to-emerald-700 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium opacity-80 uppercase tracking-widest text-xs">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{formatRupiah(452318900)}</div>
                        <p className="text-xs mt-2 opacity-70">
                            +20.1% increase from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg border-none bg-gradient-to-br from-green-500 to-green-700 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium opacity-80 uppercase tracking-widest text-xs">Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">+2,350</div>
                        <p className="text-xs mt-2 opacity-70">
                            +180.1% increase from last year
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg border-none bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium opacity-80 uppercase tracking-widest text-xs">Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">+12,234</div>
                        <p className="text-xs mt-2 opacity-70">
                            +19% increase from last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                        <CardDescription>Visual representation of monthly earnings.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] flex items-end justify-between px-6 pb-2 border-t pt-6 gap-2">
                        {data.map((item) => (
                            <div key={item.name} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-primary/20 rounded-t-lg transition-all group-hover:bg-primary/40 relative"
                                    style={{ height: `${(item.total / 5000) * 100}%` }}
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {formatRupiah(item.total * 100000)}
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-muted-foreground">{item.name}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>User Demographics</CardTitle>
                        <CardDescription>Distribution of users across regions.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] flex flex-col border-t pt-6">
                        <div className="flex-1 flex items-center justify-center relative">
                            {/* SVG Pie Chart Mockup */}
                            <svg className="w-56 h-56 -rotate-90">
                                <circle cx="112" cy="112" r="100" fill="transparent" stroke="currentColor" strokeWidth="24" strokeDasharray="628" strokeDashoffset="0" className="text-primary/10" />
                                <circle cx="112" cy="112" r="100" fill="transparent" stroke="currentColor" strokeWidth="24" strokeDasharray="628" strokeDashoffset="200" className="text-primary transition-all duration-1000" />
                                <circle cx="112" cy="112" r="100" fill="transparent" stroke="currentColor" strokeWidth="24" strokeDasharray="628" strokeDashoffset="400" className="text-blue-400" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold">64%</span>
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">Mobile</span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-8 mt-4">
                            <div className="flex items-center gap-2 text-xs font-semibold">
                                <div className="h-3 w-3 rounded-full bg-primary" />
                                <span>Desktop</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold">
                                <div className="h-3 w-3 rounded-full bg-blue-400" />
                                <span>Mobile</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold">
                                <div className="h-3 w-3 rounded-full bg-primary/10" />
                                <span>Tablet</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
