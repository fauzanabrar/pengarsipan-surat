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
     * Checks if a username or email is already taken.
     */
    static async isIdentifierTaken(username: string, email?: string): Promise<{ username: boolean; email: boolean }> {
        const filters = [eq(users.username, username)];
        if (email) {
            filters.push(eq(users.email, email));
        }

        const existingUsers = await db
            .select({ username: users.username, email: users.email })
            .from(users)
            .where(or(...filters));

        return {
            username: existingUsers.some(u => u.username === username),
            email: email ? existingUsers.some(u => u.email === email) : false,
        };
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
