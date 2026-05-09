"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

interface CategoryData {
    name: string;
    value: number;
}

export function CategoryPieChart({ data }: { data: CategoryData[] }) {
    // If no data, show a "no data" placeholder to avoid empty charts
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[240px] text-muted-foreground bg-muted/5 rounded-lg border border-dashed">
                <p className="text-sm font-bold uppercase tracking-widest opacity-20">Tidak ada data</p>
            </div>
        );
    }

    return (
        <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1000}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="stroke-background hover:opacity-80 transition-opacity outline-none" strokeWidth={2} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                            borderRadius: '12px', 
                            border: '1px solid #e2e8f0', 
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '8px 12px'
                        }}
                        formatter={(value: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(value) || 0)}
                    />
                    <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle" 
                        formatter={(value) => <span className="text-[10px] font-bold uppercase text-muted-foreground">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
