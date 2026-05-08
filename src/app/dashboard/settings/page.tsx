import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppearanceSettings } from "./appearance-settings"
import { AccountSettings } from "./account-settings"
import { NotificationSettings } from "./notification-settings"
import { AdminSettings } from "./admin-settings"
import { auth } from "@/auth"

export default async function SettingsPage() {
    const session = await auth();
    const isManager = session?.user?.role === 'GA_MANAGER';

    return (
        <div className="space-y-10">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your application preferences and account settings.</p>
            </div>

            <Tabs defaultValue="appearance" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    {isManager && (
                        <TabsTrigger value="admin">Administrator</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="appearance">
                    <AppearanceSettings />
                </TabsContent>

                <TabsContent value="account">
                    <AccountSettings />
                </TabsContent>

                <TabsContent value="notifications">
                    <NotificationSettings />
                </TabsContent>

                {isManager && (
                    <TabsContent value="admin">
                        <AdminSettings />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}
