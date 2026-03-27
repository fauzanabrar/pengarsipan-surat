import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { compare } from 'bcryptjs';
import { loginSchema } from './lib/validations';
import { UserService } from './lib/user-service';

export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const validatedFields = loginSchema.safeParse(credentials);

                if (!validatedFields.success) return null;

                const { email, password } = validatedFields.data;

                try {
                    // Use UserService to find the user
                    const user = await UserService.findByIdentifier(email);

                    if (!user) return null;

                    const passwordsMatch = await compare(password, user.password);
                    if (passwordsMatch) {
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                        };
                    }
                } catch (error) {
                    console.error("[AUTH_AUTHORIZE_ERROR]:", error);
                }

                return null;
            },
        }),
    ],
});
