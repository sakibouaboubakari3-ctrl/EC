import type { StaffRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      locale?: string;
      role?: StaffRole;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    locale?: string;
    role?: StaffRole;
  }
}

