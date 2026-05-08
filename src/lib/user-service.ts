import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { hash } from "bcryptjs";
import { RegisterInput } from "./validations";

/**
 * Service class for User-related database operations.
 * Following the Single Responsibility Principle.
 */
export class UserService {
    /**
     * Finds a user by email or username.
     */
    static async findByIdentifier(identifier: string) {
        const [user] = await db
            .select()
            .from(users)
            .where(or(eq(users.username, identifier), eq(users.email, identifier)))
            .limit(1);
        return user;
    }

    /**
     * Checks if a username is already taken.
     */
    static async isUsernameTaken(username: string): Promise<boolean> {
        const [user] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.username, username))
            .limit(1);
        return !!user;
    }

    /**
     * Checks if an email is already associated with an account.
     */
    static async isEmailTaken(email: string): Promise<boolean> {
        const [user] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        return !!user;
    }

    /**
     * Creates a new user in the database.
     */
    static async createUser(data: RegisterInput) {
        const hashedPassword = await hash(data.password, 10);

        return await db.insert(users).values({
            username: data.username,
            email: data.email || null,
            password: hashedPassword,
            name: data.name,
            location: data.location || null,
        }).returning({
            id: users.id,
            name: users.name,
            email: users.email,
        });
    }
}
