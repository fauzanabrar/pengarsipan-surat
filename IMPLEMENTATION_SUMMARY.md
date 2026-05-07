# PR Workflow Implementation Summary

## Overview
Successfully implemented the new Purchase Request (PR) workflow for the asset management application, replacing the old Employee → Manager → Finance → VP flow with a Cabang → GA → GA Manager procurement process.

## Changes Made

### 1. Database Schema (`src/db/schema.ts`)
**Already updated** with:
- **New Roles**: `CABANG`, `GA_STAFF`, `GA_MANAGER`
- **New PR States**: 
  - `PENDING_GAMBAR` - Waiting for GA to create drawings
  - `PENDING_RAB` - Waiting for GA to create budget (RAB)
  - `PENDING_GA_MANAGER` - Waiting for GA Manager approval
  - `PENDING_CABANG_PR` - Waiting for Cabang to submit approved PR
  - `PENDING_VERIFIKASI` - Waiting for GA verification
  - `PENDING_PENGADAAN` - Waiting for procurement completion
  - `COMPLETED` - Finished
  - `REJECTED` / `REVISION` - Rejected or needs revision

- **New Columns in `purchase_requests`**:
  - `surat_cabang_url` - Branch letter file
  - `gambar_url` - Drawing/design file from GA
  - `rab_url` - RAB document file
  - `ga_manager_approval_url` - GA Manager approval file
  - `verifikasi_urls` - Comma-separated verification files

### 2. File Upload System
**New Files Created**:
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/file-upload.ts` - File upload utilities supporting:
  - **Supabase Storage** - Cloud storage
  - **Local Storage** - Local file system (`/public/uploads/`)
  - **URL** - Direct external file URLs

**Configuration**:
- Set `FILE_UPLOAD_METHOD` in `.env.local` to choose default method
- Can be overridden per upload in the UI

### 3. PR Actions (`src/features/pr/actions.ts`)
**New Server Actions**:
- `createPurchaseRequest(title, description, suratCabangFile)` - CABANG creates initial PR
- `uploadGambar(prId, gambarFile)` - GA_STAFF uploads drawings
- `createRAB(prId, items, rabFile)` - GA_STAFF creates budget with items
- `approveGAManager(prId, approvalFile)` - GA_MANAGER approves RAB
- `submitPRCabang(prId, approvedPRFile)` - CABANG submits approved PR file
- `verifikasiSpesifikasi(prId, files[])` - GA_STAFF uploads verification files (multi-file)
- `selesaikanPengadaan(prId, notes)` - GA_STAFF completes procurement
- `rejectPurchaseRequest(prId, notes)` - Reject PR at any stage
- `requestRevision(prId, notes)` - Request revision

### 4. UI Components

#### Status Badge (`src/features/pr/components/status-badge.tsx`)
Updated with color-coded badges for each PR state.

#### PR Detail Page (`src/app/dashboard/pr/[id]/page.tsx`)
- Displays uploaded files with download links
- Shows verification files (multi-file support)
- Currency formatted in Indonesian Rupiah (IDR)
- Role-based action buttons

#### PR Actions (`src/app/dashboard/pr/[id]/pr-actions.tsx`)
Client component with dialogs for each action:
- File upload forms for each stage
- RAB items editor (add/remove items with qty and price)
- Upload method selector (File Upload / URL)
- Reject and Revision dialogs with notes

#### New PR Form (`src/app/dashboard/pr/new/page.tsx`)
Simplified for CABANG:
- Title and description only
- Surat Cabang file upload
- No items (items added later by GA_STAFF in RAB)

#### PR List (`src/app/dashboard/pr/page.tsx`)
- Currency formatted in IDR
- Updated queue filtering for new roles

### 5. Utilities

#### PR Utils (`src/features/pr/utils.ts`)
Updated `getRoleBasedQueueConditions` for new roles:
- **GA_STAFF**: Sees PRs pending Gambar, RAB, Verifikasi, Pengadaan
- **GA_MANAGER**: Sees PRs pending GA Manager approval
- **CABANG**: Sees PRs pending Cabang PR submission

### 6. Database Seeding
**New Files**:
- `seed.ts` - Creates test users and sample PR
- `clean-db.ts` - Utility to clean database
- `drizzle/0001_reset_schema.sql` - SQL to drop old tables/enums

**Test Users**:
```
Username: cabang       | Password: password123 | Role: CABANG
Username: ga_staff     | Password: password123 | Role: GA_STAFF
Username: ga_manager   | Password: password123 | Role: GA_MANAGER
```

### 7. Package Updates
**New Dependencies**:
- `@supabase/supabase-js` - Supabase client
- `tsx` - TypeScript execution for scripts

**New Scripts**:
- `pnpm db:push` - Push schema changes to database
- `pnpm db:seed` - Seed database with test data

## Setup Instructions

### 1. Environment Variables
Create `.env.local` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/asset-management"
AUTH_SECRET="generate-with-npx-auth-secret"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" (optional)
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" (optional)
FILE_UPLOAD_METHOD="local" (or "supabase" or "url")
```

### 2. Database Migration
```bash
# Push schema changes
pnpm drizzle-kit push

# Seed database with test users
pnpm db:seed
```

### 3. Run Development Server
```bash
pnpm dev
```

## Workflow Summary

1. **CABANG** creates PR with Surat Cabang → `PENDING_GAMBAR`
2. **GA_STAFF** uploads Gambar → `PENDING_RAB`
3. **GA_STAFF** creates RAB with items → `PENDING_GA_MANAGER`
4. **GA_MANAGER** approves with approval file → `PENDING_CABANG_PR`
5. **CABANG** uploads approved PR file → `PENDING_VERIFIKASI`
6. **GA_STAFF** uploads verification files (multi-file) → `PENDING_PENGADAAN`
7. **GA_STAFF** completes procurement → `COMPLETED`

At any stage, authorized users can:
- **Request Revision** → `REVISION` state
- **Reject** → `REJECTED` state

## Currency Format
All amounts are displayed in **Indonesian Rupiah (IDR)** using `Intl.NumberFormat('id-ID')`.

## File Storage Options

### Local Storage (Default)
- Files stored in `/public/uploads/`
- Accessible via `/uploads/{filename}`
- No additional configuration needed

### Supabase Storage
- Requires Supabase project setup
- Files stored in `pr-files` bucket
- Public URLs generated automatically

### URL Method
- Paste external file URLs directly
- No file upload required
- Useful for linking to existing documents

## Testing the Workflow

1. Login as **cabang** and create a new PR
2. Login as **ga_staff** to upload gambar and create RAB
3. Login as **ga_manager** to approve RAB
4. Login as **cabang** to submit approved PR
5. Login as **ga_staff** to upload verification files
6. Login as **ga_staff** to complete procurement

Each step will show appropriate action buttons based on user role and PR status.

## Notes

- Old database tables were dropped during migration
- All existing PR data was removed
- User accounts need to be recreated with new roles
- The workflow enforces sequential state transitions
- File uploads support multiple formats (PDF, images, documents, spreadsheets)
