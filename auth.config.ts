import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config.
 *
 * This file is imported by middleware.ts and runs on Vercel's Edge Runtime,
 * which has a 1 MB bundle size limit on the Hobby plan. It MUST NOT import:
 *   - Prisma / @prisma/client (hundreds of KB)
 *   - bcryptjs (uses Node crypto)
 *   - lib/db, lib/validators/auth (both transitively pull Prisma)
 *   - Node-only providers like Credentials
 *
 * The full config (with Credentials, Google, Prisma lookups, cart/wishlist
 * merge events) lives in auth.ts and is only loaded by the API route
 * handlers, which run on the Node runtime where size is not a concern.
 */

// UserRole is duplicated here instead of imported from @prisma/client so the
// edge bundler never sees the Prisma import graph. Keep in sync with
// prisma/schema.prisma `enum UserRole`.
type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

export const authConfig = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [], // real providers are added in auth.ts (Node runtime)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
