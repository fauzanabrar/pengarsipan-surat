import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log("Starting manual SQL migration for PR tables...");

    try {
        // Enums
        await db.execute(sql`
            DO $$ BEGIN
                CREATE TYPE "role" AS ENUM ('EMPLOYEE', 'MANAGER', 'FINANCE', 'VP');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await db.execute(sql`
            DO $$ BEGIN
                CREATE TYPE "pr_state" AS ENUM ('DRAFT', 'PENDING_MANAGER', 'PENDING_FINANCE', 'PENDING_VP', 'APPROVED', 'REJECTED', 'REVISION');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Add Role to Users
        await db.execute(sql`
            ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "role" DEFAULT 'EMPLOYEE' NOT NULL;
        `);
        console.log("Added role to users.");

        // Purchase Requests Table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "purchase_requests" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "requester_id" uuid NOT NULL,
                "title" text NOT NULL,
                "description" text,
                "total_amount" numeric(12, 2) NOT NULL,
                "status" "pr_state" DEFAULT 'DRAFT' NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL,
                CONSTRAINT "purchase_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE
            );
        `);
        console.log("Created purchase_requests table.");

        // PR Items
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "pr_items" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "pr_id" uuid NOT NULL,
                "name" text NOT NULL,
                "quantity" integer DEFAULT 1 NOT NULL,
                "price" numeric(12, 2) NOT NULL,
                "url" text,
                CONSTRAINT "pr_items_pr_id_fkey" FOREIGN KEY ("pr_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE
            );
        `);
        console.log("Created pr_items table.");

        // Approval Logs
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "approval_logs" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "pr_id" uuid NOT NULL,
                "actor_id" uuid NOT NULL,
                "action" text NOT NULL,
                "notes" text,
                "created_at" timestamp DEFAULT now() NOT NULL,
                CONSTRAINT "approval_logs_pr_id_fkey" FOREIGN KEY ("pr_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE,
                CONSTRAINT "approval_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE
            );
        `);
        console.log("Created approval_logs table.");

        console.log("Migration finished successfully!");
        process.exit(0);

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

main();
