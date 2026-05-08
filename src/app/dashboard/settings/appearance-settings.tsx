"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/mode-toggle"
import { Label } from "@/components/ui/label"

export function AppearanceSettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Theme Preferences</CardTitle>
                <CardDescription>
                    Customize the look and feel of the application.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label>Theme Mode</Label>
                        <p className="text-sm text-muted-foreground">
                            Select your preferred theme.
                        </p>
                    </div>
                    <ModeToggle />
                </div>
            </CardContent>
        </Card>
    )
}
