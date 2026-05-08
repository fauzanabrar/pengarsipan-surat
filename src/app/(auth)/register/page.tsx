"use client"

import { useState, useTransition } from "react"
import { register } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AuthCard } from "@/components/auth-card"

export default function RegisterPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [errors, setErrors] = useState<Record<string, string[]>>({})

    async function handleSubmit(formData: FormData) {
        setErrors({})

        startTransition(async () => {
            const result = await register(formData)

            if (result?.error) {
                if (typeof result.error === "object") {
                    setErrors(result.error)
                } else {
                    toast.error(result.error)
                }
                return
            }

            toast.success("Account created successfully!")
            router.push("/login")
        })
    }

    return (
        <AuthCard
            title="Create an account"
            description="Enter your details below to create your account"
            footerText="Already have an account?"
            footerLinkText="Sign in"
            footerLinkHref="/login"
        >
            <form action={handleSubmit}>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="John Doe"
                            required
                            disabled={isPending}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500">{errors.name[0]}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            name="username"
                            placeholder="johndoe123"
                            required
                            disabled={isPending}
                        />
                        {errors.username && (
                            <p className="text-xs text-red-500">{errors.username[0]}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="m@example.com"
                            disabled={isPending}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">{errors.email[0]}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="location">Nama Cabang / Lokasi (Optional)</Label>
                        <Input
                            id="location"
                            name="location"
                            placeholder="Contoh: Cabang Makassar"
                            disabled={isPending}
                        />
                        {errors.location && (
                            <p className="text-xs text-red-500">{errors.location[0]}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            disabled={isPending}
                        />
                        {errors.password && (
                            <p className="text-xs text-red-500">{errors.password[0]}</p>
                        )}
                    </div>
                    <Button className="w-full" type="submit" disabled={isPending}>
                        {isPending ? "Creating account..." : "Create account"}
                    </Button>
                </div>
            </form>
        </AuthCard>
    )
}
