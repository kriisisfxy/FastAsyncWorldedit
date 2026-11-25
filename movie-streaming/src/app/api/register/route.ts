import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { handler, HttpError, json, parseBody } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";

export const POST = handler(async (req: Request) => {
  if (!rateLimit(clientKey(req, "register"), 5, 60 * 60 * 1000)) throw new HttpError(429, "Too many sign-ups. Try again later.");
  const { name, email, password } = await parseBody(req, registerSchema);
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    throw new HttpError(409, "An account with this email already exists.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.create({ data: { name, email, passwordHash } });
  return json({ ok: true }, 201);
});
