import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type {} from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { verifyStaffCredentials } from '@/lib/auth/verify-staff';

export const {
  handlers: staffAuthHandlers,
  auth: staffAuth,
  signIn: staffSignIn,
  signOut: staffSignOut,
} = NextAuth({
  basePath: '/api/auth/staff',
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: 'staff-session-token',
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.VERCEL === '1' },
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        const staff = await verifyStaffCredentials(prisma, email, password);
        if (!staff) return null;
        return { id: staff.id, email: staff.email, name: staff.name, role: staff.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: 'AGENT' | 'SUPERVISOR' | 'ADMIN' }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role;
      return session;
    },
  },
});
