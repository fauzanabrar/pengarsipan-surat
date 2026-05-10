"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { UploadZone } from "./upload-zone"
import { FileItem } from "./file-item"

interface FileUploaderProps {
    className?: string
    multiple?: boolean
    onFileUploaded?: (url: string) => void
    accept?: string
}

export function FileUploader({ className, multiple = false, onFileUploaded, accept }: FileUploaderProps) {
    const [files, setFiles] = React.useState<{ id: string; file: File; url: string }[]>([])

    const handleFilesSelected = React.useCallback((selectedFiles: File[]) => {
        const filteredFiles = accept 
            ? selectedFiles.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
            : selectedFiles
        
        const newFiles = filteredFiles.map(f => ({
            id: Math.random().toString(36).substring(7),
            file: f,
            url: URL.createObjectURL(f)
        }))

        if (multiple) {
            setFiles(prev => [...prev, ...newFiles])
        } else {
            setFiles(newFiles)
        }

        if (newFiles.length > 0 && onFileUploaded) {
            onFileUploaded(newFiles[0].url)
        }
    }, [multiple, onFileUploaded, accept])

    const removeFile = React.useCallback((id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id))
        if (files.length === 1 && onFileUploaded) {
            onFileUploaded('')
        }
    }, [files, onFileUploaded])

    return (
        <div className={cn("space-y-4", className)}>
            <UploadZone multiple={multiple} onFilesSelected={handleFilesSelected} accept={accept} />

            {files.length > 0 && (
                <div className="grid gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {files.map((file) => (
                        <FileItem 
                            key={file.id} 
                            file={{ ...file, progress: 100, status: "completed" }} 
                            onRemove={removeFile} 
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
