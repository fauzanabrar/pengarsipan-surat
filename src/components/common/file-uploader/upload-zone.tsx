"use client"

import * as React from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadZoneProps {
    multiple: boolean
    onFilesSelected: (files: File[]) => void
    accept?: string
}

export function UploadZone({ multiple, onFilesSelected, accept }: UploadZoneProps) {
    const [isDragging, setIsDragging] = React.useState(false)

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFiles = Array.from(e.dataTransfer.files)
        onFilesSelected(multiple ? droppedFiles : [droppedFiles[0]])
    }

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={cn(
                "relative group border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all duration-300",
                isDragging
                    ? "border-indigo-500 bg-indigo-500/5 scale-[0.99] shadow-inner"
                    : "border-muted-foreground/20 hover:border-indigo-500/50 hover:bg-muted/30 dark:hover:bg-zinc-900/50"
            )}
        >
            <div className={cn(
                "h-16 w-16 rounded-full flex items-center justify-center bg-muted dark:bg-zinc-800 transition-transform duration-300 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:text-indigo-500",
                isDragging && "scale-110 bg-indigo-500/10 text-indigo-500 animate-pulse"
            )}>
                <Upload className="h-8 w-8" />
            </div>
            <div className="text-center space-y-1">
                <p className="font-bold text-lg dark:text-zinc-100">Click or drag {multiple ? 'files' : 'a file'} to upload</p>
                <p className="text-sm text-muted-foreground dark:text-zinc-400">Support for PDF files
                </p>
            </div>
            <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                multiple={multiple}
                accept={accept}
                onChange={(e) => e.target.files && onFilesSelected(Array.from(e.target.files))}
            />
        </div>
    )
}
