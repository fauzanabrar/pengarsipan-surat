'use server';

import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { supabase, isSupabaseConfigured } from './supabase';

const LOCAL_UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export type FileUploadMethod = 'supabase' | 'local' | 'url';

export interface FileUploadOptions {
    method?: FileUploadMethod;
    bucket?: string; // Supabase bucket name
    fileName?: string; // Custom filename for local/supabase upload
}

/**
 * Upload a file and return the URL.
 * Supports Supabase Storage, local file system, or external URLs.
 */
export async function uploadFile(
    file: File,
    options: FileUploadOptions = {}
): Promise<string> {
    const method = options.method ?? getFileUploadMethod();
    
    if (method === 'url') {
        throw new Error('Cannot upload File object with URL method. Use uploadFileFromUrl instead.');
    }

    if (method === 'supabase' && isSupabaseConfigured()) {
        return uploadToSupabase(file, options);
    }

    // Fallback to local storage
    return uploadToLocal(file, options);
}

/**
 * Upload a file from a URL and return the stored URL.
 */
export async function uploadFileFromUrl(
    fileUrl: string,
    options: FileUploadOptions = {}
): Promise<string> {
    const method = options.method ?? getFileUploadMethod();

    if (method === 'url') {
        // Just return the URL as-is
        return fileUrl;
    }

    // For supabase or local, we need to fetch and store the file
    try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
        
        const blob = await response.blob();
        const file = new File([blob], options.fileName ?? getFilenameFromUrl(fileUrl), {
            type: blob.type || 'application/octet-stream'
        });

        if (method === 'supabase' && isSupabaseConfigured()) {
            return uploadToSupabase(file, options);
        }

        return uploadToLocal(file, options);
    } catch (error) {
        console.error('Error uploading file from URL:', error);
        // Fallback: just return the original URL
        return fileUrl;
    }
}

/**
 * Upload multiple files from URLs
 */
export async function uploadFilesFromUrls(
    fileUrls: string[],
    options: FileUploadOptions = {}
): Promise<string[]> {
    const results: string[] = [];
    for (const url of fileUrls) {
        const result = await uploadFileFromUrl(url, options);
        results.push(result);
    }
    return results;
}

/**
 * Upload a file to Supabase Storage
 */
async function uploadToSupabase(file: File, options: FileUploadOptions = {}): Promise<string> {
    if (!supabase) {
        throw new Error('Supabase is not configured');
    }

    const bucket = options.bucket ?? 'pr-files';
    const fileName = options.fileName ?? `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(fileName, buffer, {
            contentType: file.type || 'application/octet-stream',
            duplex: 'half',
        });

    if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(data.path);

    return urlData.publicUrl;
}

/**
 * Upload a file to local storage
 */
async function uploadToLocal(file: File, options: FileUploadOptions = {}): Promise<string> {
    const fileName = options.fileName ?? `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    
    // Ensure upload directory exists
    if (!existsSync(LOCAL_UPLOAD_DIR)) {
        await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
    }

    const filePath = join(LOCAL_UPLOAD_DIR, fileName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(filePath, buffer);

    // Return relative URL path
    return `/uploads/${fileName}`;
}

/**
 * Determine the upload method based on configuration and preference
 */
function getFileUploadMethod(): FileUploadMethod {
    const envMethod = process.env.FILE_UPLOAD_METHOD;
    if (envMethod === 'supabase' || envMethod === 'local' || envMethod === 'url') {
        return envMethod;
    }
    // Default: use supabase if configured, otherwise local
    return isSupabaseConfigured() ? 'supabase' : 'local';
}

/**
 * Extract filename from URL
 */
function getFilenameFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        return pathname.split('/').pop() ?? `file-${Date.now()}`;
    } catch {
        return `file-${Date.now()}`;
    }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(fileUrl: string, options: FileUploadOptions = {}): Promise<void> {
    const method = options.method ?? getFileUploadMethod();

    if (method === 'url') {
        // Cannot delete external URLs
        return;
    }

    if (method === 'supabase' && isSupabaseConfigured() && fileUrl.includes('supabase.co')) {
        const bucket = options.bucket ?? 'pr-files';
        // Extract path from URL
        const path = extractSupabasePath(fileUrl);
        if (path) {
            await supabase!.storage.from(bucket).remove([path]);
        }
        return;
    }

    // Local file deletion
    if (fileUrl.startsWith('/uploads/')) {
        const fileName = fileUrl.replace('/uploads/', '');
        const filePath = join(LOCAL_UPLOAD_DIR, fileName);
        const { unlink } = await import('fs/promises');
        try {
            await unlink(filePath);
        } catch (error) {
            console.error('Error deleting local file:', error);
        }
    }
}

/**
 * Extract Supabase storage path from public URL
 */
function extractSupabasePath(url: string): string | null {
    try {
        const urlObj = new URL(url);
        // Supabase URL pattern: /storage/v1/object/public/{bucket}/{path}
        const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
        return match?.[1] ?? null;
    } catch {
        return null;
    }
}
