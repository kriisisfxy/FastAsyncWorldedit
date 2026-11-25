import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { handler, HttpError, json, parseBody } from "@/lib/http";
import { resetSchema } from "@/lib/validation";

export const POST = handler(async (req: Request) => {
  const { token, password } = await parseBody(req, resetSchema);
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const row = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!row || row.usedAt || row.expiresAt < new Date()) throw new HttpError(400, "This reset link is invalid or has expired.");
  const passwordHash = await bcrypt.hash(password, 12);
  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  return json({ ok: true });
});
