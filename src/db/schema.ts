import { pgTable, text, timestamp, uuid, pgEnum, integer, serial } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['ADMIN', 'USER']);
export const suratTypeEnum = pgEnum('surat_type', ['MASUK', 'KELUAR']);

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    username: text('username').notNull().unique(),
    email: text('email'),
    password: text('password').notNull(),
    name: text('name'),
    avatarUrl: text('avatar_url'),
    role: roleEnum('role').default('USER').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const identifikasi = pgTable('identifikasi', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    code: text('code').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const kodeSurat = pgTable('kode_surat', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    code: text('code').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const settings = pgTable('settings', {
    id: serial('id').primaryKey(),
    nomorSuratFormat: text('nomor_surat_format').default('{nomor}/{kode}/{identifikasi}/{tahun}').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const surat = pgTable('surat', {
    id: uuid('id').defaultRandom().primaryKey(),
    type: suratTypeEnum('type').notNull(),
    nomorSurat: text('nomor_surat').notNull().unique(),
    nomorUrut: integer('nomor_urut').notNull(),
    tanggalSurat: timestamp('tanggal_surat').notNull(),
    identifikasiId: uuid('identifikasi_id').references(() => identifikasi.id, { onDelete: 'restrict' }).notNull(),
    kodeSuratId: uuid('kode_surat_id').references(() => kodeSurat.id, { onDelete: 'restrict' }).notNull(),
    perihal: text('perihal').notNull(),
    tujuan: text('tujuan'),
    penerima: text('penerima'),
    picUserId: uuid('pic_user_id').references(() => users.id, { onDelete: 'restrict' }),
    fileUrl: text('file_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Identifikasi = typeof identifikasi.$inferSelect;
export type NewIdentifikasi = typeof identifikasi.$inferInsert;
export type KodeSurat = typeof kodeSurat.$inferSelect;
export type NewKodeSurat = typeof kodeSurat.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
export type Surat = typeof surat.$inferSelect;
export type NewSurat = typeof surat.$inferInsert;
