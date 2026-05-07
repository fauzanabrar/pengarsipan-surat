import NextAuth, { type DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: 'CABANG' | 'GA_STAFF' | 'GA_MANAGER';
        } & DefaultSession['user'];
    }

    interface User {
        role: 'CABANG' | 'GA_STAFF' | 'GA_MANAGER';
    }
}
