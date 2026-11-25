import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}

const REFRESH_MS = 5 * 60 * 1000;
const DUMMY_HASH = bcrypt.hashSync("timing-equaliser", 10);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        if (!rateLimit(`login:${email}`, 8, 15 * 60 * 1000)) throw new TooManyAttempts();
        const user = await db.user.findUnique({ where: { email } });
        // Compare against a dummy hash when the user is missing so timing does not reveal accounts.
        const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !ok || user.disabled) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.avatarUrl, role: user.role };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.picture = user.image ?? null;
        token.refreshedAt = Date.now();
        return token;
      }
      // Periodically re-read role/avatar/disabled so admin changes take effect without re-login.
      const stale = !token.refreshedAt || Date.now() - (token.refreshedAt as number) > REFRESH_MS;
      if (token.sub && (stale || trigger === "update")) {
        const fresh = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true, name: true, avatarUrl: true, disabled: true },
        });
        if (!fresh || fresh.disabled) return null;
        token.role = fresh.role;
        token.name = fresh.name;
        token.picture = fresh.avatarUrl;
        token.refreshedAt = Date.now();
      }
      return token;
    },
  },
});
