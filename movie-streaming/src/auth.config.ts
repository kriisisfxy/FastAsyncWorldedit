import type { NextAuthConfig } from "next-auth";

/** Edge-safe part of the Auth.js config (used by middleware; no database access here). */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const user = auth?.user;
      if (path.startsWith("/admin") || path.startsWith("/api/admin")) return user?.role === "ADMIN";
      if (path.startsWith("/profile") || path.startsWith("/my-list") || path.startsWith("/api/me")) return !!user;
      return true;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      session.user.image = (token.picture as string | null) ?? null;
      session.user.name = (token.name as string) ?? session.user.name;
      return session;
    },
  },
} satisfies NextAuthConfig;
