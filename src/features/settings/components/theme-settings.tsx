'use client';

import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeSettings() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b">
                <CardTitle className="text-lg">Tampilan & Tema</CardTitle>
                <CardDescription>Pilih tema yang paling nyaman untuk mata Anda.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <RadioGroup 
                    defaultValue={theme} 
                    onValueChange={setTheme}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <div className="relative">
                        <RadioGroupItem
                            value="light"
                            id="light"
                            className="peer sr-only"
                        />
                        <Label
                            htmlFor="light"
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=active]:border-primary peer-data-[state=active]:ring-1 peer-data-[state=active]:ring-primary/20 [&:has([data-state=active])]:border-primary transition-all cursor-pointer"
                        >
                            <Sun className="mb-3 h-8 w-8 text-orange-500" />
                            <span className="font-bold">Terang</span>
                        </Label>
                    </div>
                    
                    <div className="relative">
                        <RadioGroupItem
                            value="dark"
                            id="dark"
                            className="peer sr-only"
                        />
                        <Label
                            htmlFor="dark"
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=active]:border-primary peer-data-[state=active]:ring-1 peer-data-[state=active]:ring-primary/20 [&:has([data-state=active])]:border-primary transition-all cursor-pointer"
                        >
                            <Moon className="mb-3 h-8 w-8 text-indigo-400" />
                            <span className="font-bold">Gelap</span>
                        </Label>
                    </div>

                    <div className="relative">
                        <RadioGroupItem
                            value="system"
                            id="system"
                            className="peer sr-only"
                        />
                        <Label
                            htmlFor="system"
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=active]:border-primary peer-data-[state=active]:ring-1 peer-data-[state=active]:ring-primary/20 [&:has([data-state=active])]:border-primary transition-all cursor-pointer"
                        >
                            <Monitor className="mb-3 h-8 w-8 text-slate-400" />
                            <span className="font-bold">Sistem</span>
                        </Label>
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>
    );
}
