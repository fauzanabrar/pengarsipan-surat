Goal Description
The objective is to redesign the Purchase Request (PR) workflow in the asset management application to align with the company's specific procurement process. The new flow involves interactions between Branches (Cabang), General Affairs (GA), and GA Managers.

Instead of a standard Employee -> Manager -> Finance -> VP flow, the new process is:

(Cabang) Pengajuan Surat Cabang ke Head Office
(General Affairs) Pembuatan Gambar
(General Affairs) Pembuatan RAB
(GA Manager) Approval RAB & Gambar (dengan output file)
(Cabang) Melakukan PR berdasarkan RAB yang disetujui (PR otomatis/manual disetujui - butuh konfirmasi)
(General Affairs) Verifikasi Spesifikasi (bisa multi-file & opsional)
(General Affairs) Proses Pengadaan (PO, Pengiriman, Serah Terima Barang)
All currencies used will be formatted and stored as IDR (Rupiah).

User Review Required
WARNING

This represents a major refactor of the database schema and application logic. All existing dummy PR data might need to be dropped or migrated, and current roles will be replaced.

Proposed Changes
Database Schema Updates (src/db/schema.ts)
[MODIFY] schema.ts
Roles Enum: Replace the existing roles (EMPLOYEE, MANAGER, FINANCE, VP) with the new roles:
CABANG (Untuk user di cabang)
GA_STAFF (Untuk tim General Affairs yang memproses gambar, RAB, verifikasi, dan pengadaan)
GA_MANAGER (Untuk manajer GA yang meng-approve dokumen)
PR State Enum: Replace existing states with strict sequential states representing the new flow:
PENDING_GAMBAR (Menunggu GA membuat gambar)
PENDING_RAB (Menunggu GA membuat RAB)
PENDING_GA_MANAGER (Menunggu GA Manager Approve)
PENDING_CABANG_PR (Menunggu Cabang untuk membuat/mensubmit PR)
PENDING_VERIFIKASI (Menunggu GA memverifikasi spesifikasi)
PENDING_PENGADAAN (Menunggu proses PO/Pengiriman/Serah Terima oleh GA)
COMPLETED (Selesai serah terima)
REJECTED / REVISED (Jika ditolak/butuh revisi di salah satu tahap)
Purchase Requests Table: Add columns to support multi-step file uploads:
suratCabangUrl (Opsional/File surat pengajuan awal)
gambarUrl (Opsional/File gambar dari GA)
rabUrl / gaManagerApprovalUrl (Opsional/File bukti approve GA Manager)
verifikasiSpesifikasiUrls (Array of strings - support multi-file upload)
Logic & Workflows (src/features/pr/actions.ts)
[MODIFY] actions.ts
Update createPurchaseRequest to just initialize the PR and set state to PENDING_GAMBAR. Cabang akan upload "Surat Cabang" di tahap ini. Items detail mungkin belum ada karena RAB belum dibuat.
Create new transition actions:
uploadGambar(prId, url): GA mengupload gambar. Status -> PENDING_RAB.
createRAB(prId, items): GA memasukkan item & harga (RAB). Status -> PENDING_GA_MANAGER.
approveGAManager(prId, fileUrl): GA Manager menyetujui, mengupload file manager approval. Status -> PENDING_CABANG_PR.
submitPRCabang(prId): Cabang memproses/mensubmit PR. Status -> PENDING_VERIFIKASI (asumsi otomatis "PR Approved").
verifikasiSpesifikasi(prId, fileUrls[]): GA melakukan verifikasi. Status -> PENDING_PENGADAAN.
selesaikanPengadaan(prId): GA menyelesaikan proses PO & serah terima barang. Status -> COMPLETED.
UI Forms and Detail View (src/app/dashboard/pr/[id]/page.tsx dll)
[MODIFY] Detail Page UI & Components
Add appropriate file upload UI at each stage depending on the user's role.
Currency Format updates to strictly IDR (Rupiah) everywhere instead of $.
Ensure Role-Based Access Control hides/shows the right buttons for CABANG, GA_STAFF, and GA_MANAGER.
Open Questions
IMPORTANT

Mohon konfirmasi beberapa hal berikut sebelum saya mengeksekusi rencananya:

Tentang "PR Approved": Di tahap "Cabang melakukan PR -> (Cabang) PR approved", apakah ketika cabang menekan tombol "Submit/Lakukan PR", statusnya otomatis dianggap disetujui (Approved) dan langsung berpindah ke "Verifikasi Spesifikasi" oleh GA, atau ada pihak lain (contoh: Branch Manager) yang harus mem-klik tombol Approve?
File Multi-file Verifikasi: Untuk fitur upload file verifikasi yang multi-file, apakah saat ini proyek sudah menggunakan layanan object storage tertentu (misal: AWS S3, Supabase Storage, Vercel Blob, atau uploadthing/sejenisnya), atau kamu ingin menyimpannya secara lokal / menggunakan placeholder untuk sementara?
Data Lama: Karena role dan status akan diubah total, apakah boleh saya me-reset (drop table dan recreate) database-nya menggunakan Drizzle untuk menghindari error data lama yang tidak kompatibel?
Tahap Pengadaan: Di tahap paling akhir ("Proses pengadaan barang dan jasa..."), apakah ini cukup diringkas ke 1 tombol "Selesaikan Pengadaan" saja bagi GA, atau butuh tahapan terpisah untuk PO, Pengiriman, dan Serah Terima secara berurutan?
Verification Plan
Automated Tests
N/A - Testing will rely on manual functional validation of the state machine.
Manual Verification
Seed the DB with User accounts for each new Role (CABANG, GA_STAFF, GA_MANAGER).
Simulate an end-to-end PR creation:
Login as CABANG, create request.
Login as GA_STAFF, upload Gambar, then submit RAB (Items & Amount in RP).
Login as GA_MANAGER, approve RAB.
Login as CABANG, execute PR.
Login as GA_STAFF, upload spec files (optional).
Login as GA_STAFF, mark as Completed/Handover.