"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { UploadCloud, Link as LinkIcon, File as FileIcon, X } from "lucide-react"

interface UniversalUploaderProps {
    onFileSelected: (file: File | null) => void;
    onUrlEntered: (url: string) => void;
    currentMode: "file" | "url";
    onModeChange: (mode: "file" | "url") => void;
}

export function UniversalUploader({ onFileSelected, onUrlEntered, currentMode, onModeChange }: UniversalUploaderProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [url, setUrl] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
        onFileSelected(file);
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
        onUrlEntered(e.target.value);
    };

    const removeFile = () => {
        setSelectedFile(null);
        onFileSelected(null);
    }

    return (
        <Tabs value={currentMode} onValueChange={(val) => onModeChange(val as "file" | "url")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">
                    <UploadCloud className="mr-2 h-4 w-4" /> Local Upload
                </TabsTrigger>
                <TabsTrigger value="url">
                    <LinkIcon className="mr-2 h-4 w-4" /> Link URL
                </TabsTrigger>
            </TabsList>
            <TabsContent value="file" className="mt-4">
                {selectedFile ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                                <FileIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{selectedFile.name}</span>
                                <span className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        </div>
                        <button type="button" onClick={removeFile} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 bg-muted/20 hover:bg-muted/50 transition-colors">
                        <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                        <p className="text-sm font-medium">Click to upload file</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF documents only</p>
                        <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                        />
                    </div>
                )}
            </TabsContent>
            <TabsContent value="url" className="mt-4">
                <div className="space-y-2">
                    <Input 
                        type="url" 
                        placeholder="https://example.com/document.pdf" 
                        value={url}
                        onChange={handleUrlChange}
                    />
                    <p className="text-xs text-muted-foreground">Paste a direct link to the PDF document.</p>
                </div>
            </TabsContent>
        </Tabs>
    )
}
