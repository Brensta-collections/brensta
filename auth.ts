import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth";

const providers = [];

providers.push(
  Credentials({
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      const parsed = loginSchema.safeParse(raw);
      if (!parsed.success) return null;
      const { email, password } = parsed.data;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash || !user.isActive) return null;
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
        role: user.role,
      };
    },
  })
);

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  trustHost: true,
  providers,
  callbacks: {
    async signIn({ user, account }) {
      // Google first-time users: persist a User row (JWT-only strategy, no adapter)
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
        if (!existing) {
          const created = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              image: user.image ?? null,
              emailVerified: new Date(),
              role: "CUSTOMER",
            },
          });
          (user as { id: string }).id = created.id;
          (user as { role: UserRole }).role = created.role;
        } else {
          if (!existing.isActive) return false;
          (user as { id: string }).id = existing.id;
          (user as { role: UserRole }).role = existing.role;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user?.id) return;
      // Merge guest cart (if any) into the user's cart.
      try {
        const { mergeGuestCartIntoUser } = await import("@/lib/cart-merge");
        await mergeGuestCartIntoUser(user.id);
      } catch (e) {
        console.error("[auth] cart merge failed", e);
      }
      // Merge guest wishlist (if any) into the user's wishlist.
      try {
        const { mergeGuestWishlistIntoUser } = await import("@/lib/wishlist-merge");
        await mergeGuestWishlistIntoUser(user.id);
      } catch (e) {
        console.error("[auth] wishlist merge failed", e);
      }
    },
  },
});
