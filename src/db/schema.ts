import { pgTable, text, timestamp, uuid, pgEnum, decimal, integer } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['CABANG', 'GA_STAFF', 'GA_MANAGER']);
export const prStateEnum = pgEnum('pr_state', ['PENDING_GAMBAR', 'PENDING_RAB', 'PENDING_GA_MANAGER', 'PENDING_CABANG_PR', 'PENDING_VERIFIKASI', 'PENDING_PENGADAAN', 'COMPLETED', 'REJECTED', 'REVISION']);

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
    description: text('description'),
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default("0").notNull(),
    status: prStateEnum('status').default('PENDING_GAMBAR').notNull(),
    suratCabangUrl: text('surat_cabang_url'),
    gambarUrl: text('gambar_url'),
    rabUrl: text('rab_url'),
    gaManagerApprovalUrl: text('ga_manager_approval_url'),
    verifikasiUrls: text('verifikasi_urls'), // Comma-separated strings
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const prItems = pgTable('pr_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    prId: uuid('pr_id').references(() => purchaseRequests.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    quantity: integer('quantity').default(1).notNull(),
    price: decimal('price', { precision: 12, scale: 2 }).notNull(),
    url: text('url'),
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
export type PRItem = typeof prItems.$inferSelect;
export type ApprovalLog = typeof approvalLogs.$inferSelect;
