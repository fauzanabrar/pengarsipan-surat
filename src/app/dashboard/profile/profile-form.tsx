'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from '@/features/users/actions';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';
import { User } from '@/db/schema';

export function ProfileForm({ user }: { user: User }) {
    const [name, setName] = useState(user.name || '');
    const [email, setEmail] = useState(user.email || '');
    const [isSaving, setIsSaving] = useState(false);
    
    // Avatar upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [shouldRemove, setShouldRemove] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setShouldRemove(false);
        }
    };

    const handleRemovePhoto = () => {
        setAvatarFile(null);
        setPreviewUrl(null);
        setShouldRemove(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            
            if (shouldRemove) {
                formData.append('removeAvatar', 'true');
            } else if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            await updateProfile(formData);
            toast.success('Profile updated successfully');
            setAvatarFile(null);
            setShouldRemove(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to update profile';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const displayAvatar = shouldRemove ? null : (previewUrl || user.avatarUrl);

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: User Info */}
            <div className="flex-1 space-y-6">
                <Card className="shadow-lg border-none ring-1 ring-black/5 dark:ring-white/10">
                    <CardHeader className="bg-muted/30 border-b pb-5">
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your personal details here.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid gap-2">
                            <Label htmlFor="username" className="text-muted-foreground">Username (Read-only)</Label>
                            <Input id="username" value={user.username} disabled className="bg-muted/50" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input 
                                id="name" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                placeholder="Enter your full name"
                                className="border-primary/20 focus-visible:ring-primary/20"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                                id="email" 
                                type="email"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="Enter your email address"
                                className="border-primary/20 focus-visible:ring-primary/20"
                            />
                        </div>



                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                        >
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Avatar */}
            <div className="w-full lg:w-80 space-y-6">
                <Card className="shadow-lg border-none ring-1 ring-black/5 dark:ring-white/10">
                    <CardHeader className="bg-muted/30 border-b pb-5">
                        <CardTitle>Avatar</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6 pt-6">
                        <Avatar className="h-32 w-32 border-4 border-muted shadow-xl">
                            {displayAvatar && <AvatarImage src={displayAvatar} alt={user.username} className="object-cover" />}
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-3xl">
                                {(user.name || user.username)[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        
                        <div className="w-full flex flex-col gap-2">
                            <Button 
                                variant="outline" 
                                className="w-full border-primary/20 hover:bg-primary/5 gap-2"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <UploadCloud className="h-4 w-4" />
                                {avatarFile ? 'Change Image' : 'Upload New'}
                            </Button>

                            {(user.avatarUrl || previewUrl) && !shouldRemove && (
                                <Button 
                                    variant="ghost" 
                                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
                                    onClick={handleRemovePhoto}
                                >
                                    Remove Photo
                                </Button>
                            )}
                        </div>
                        
                        {(avatarFile || shouldRemove) && (
                            <p className="text-xs text-muted-foreground text-center">
                                {shouldRemove ? 'Photo marked for removal.' : 'New photo selected.'} Don&apos;t forget to save!
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
