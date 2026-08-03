import type { NextAuthConfig } from "next-auth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/leads",
  "/pipeline",
  "/follow-ups",
  "/analytics",
  "/team",
  "/billing",
  "/settings",
  "/onboarding",
];

/**
 * Edge-safe base config (no Prisma/bcrypt providers here) so `middleware.ts`
 * can run `auth()` on the Edge runtime without bundling Node-only drivers.
 * The Credentials provider itself is added in `lib/auth.ts`, which is only
 * ever imported from Node-runtime route handlers / server components.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = PROTECTED_PREFIXES.some((p) =>
        request.nextUrl.pathname.startsWith(p),
      );
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
