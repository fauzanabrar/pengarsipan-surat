import { pgTable, text, timestamp, uuid, pgEnum, decimal, integer } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['CABANG', 'GA_STAFF', 'GA_MANAGER']);
export const prStateEnum = pgEnum('pr_state', ['MENUNGGU_RAB', 'MENUNGGU_PR', 'MENUNGGU_DIVERIFIKASI', 'DITERIMA', 'DITOLAK']);

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    username: text('username').notNull().unique(),
    email: text('email'), // Optional email
    password: text('password').notNull(),
    name: text('name'),
    avatarUrl: text('avatar_url'),
    role: roleEnum('role').default('CABANG').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const purchaseRequests = pgTable('purchase_requests', {
    id: uuid('id').defaultRandom().primaryKey(),
    requesterId: uuid('requester_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    status: prStateEnum('status').default('MENUNGGU_RAB').notNull(),
    
    // Stage 1: Ajukan Permohonan
    suratPengajuanUrl: text('surat_pengajuan_url'),
    keteranganPengajuan: text('keterangan_pengajuan'),
    
    // Stage 2: Upload RAB (by GA Staff)
    rabUrl: text('rab_url'),
    keteranganRab: text('keterangan_rab'),
    
    // Stage 3: Upload PR (by GA Staff)
    prUrl: text('pr_url'),
    keteranganPr: text('keterangan_pr'),
    
    // Stage 4: Verifikasi Manager
    keteranganManager: text('keterangan_manager'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const approvalLogs = pgTable('approval_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    prId: uuid('pr_id').references(() => purchaseRequests.id, { onDelete: 'cascade' }).notNull(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    action: text('action').notNull(), // e.g. 'SUBMIT', 'APPROVE', 'REJECT', 'REVISE'
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PurchaseRequest = typeof purchaseRequests.$inferSelect;
export type ApprovalLog = typeof approvalLogs.$inferSelect;
