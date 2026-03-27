import NextAuth, { type DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | 'VP';
        } & DefaultSession['user'];
    }

    interface User {
        role: 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | 'VP';
    }
}
