import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type {} from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { verifyClientCredentials } from '@/lib/auth/verify-client';

export const {
  handlers: clientAuthHandlers,
  auth: clientAuth,
  signIn: clientSignIn,
  signOut: clientSignOut,
} = NextAuth({
  basePath: '/api/auth/client',
  trustHost: true,
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: 'client-session-token',
      options: { httpOnly: true, sameSite: 'lax', path: '/' },
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        const client = await verifyClientCredentials(prisma, email, password);
        if (!client) return null;
        return {
          id: client.id,
          email: client.email,
          name: `${client.firstName} ${client.lastName}`,
          locale: client.locale,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.locale = (user as { locale?: string }).locale;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.locale = token.locale;
      return session;
    },
  },
});
