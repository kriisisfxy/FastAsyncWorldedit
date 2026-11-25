import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { handler, HttpError, json, parseBody } from "@/lib/http";
import { sendMail } from "@/lib/mail";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { forgotSchema } from "@/lib/validation";

export const POST = handler(async (req: Request) => {
  if (!rateLimit(clientKey(req, "forgot"), 5, 60 * 60 * 1000)) throw new HttpError(429, "Too many requests. Try again later.");
  const { email } = await parseBody(req, forgotSchema);
  const user = await db.user.findUnique({ where: { email } });
  // Always answer the same way so the endpoint does not reveal which emails are registered.
  if (user && !user.disabled) {
    const token = randomBytes(32).toString("base64url");
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const base = process.env.APP_URL || new URL(req.url).origin;
    await sendMail(
      user.email,
      "Reset your Nocturne password",
      `Hi ${user.name},\n\nUse this link within one hour to choose a new password:\n${base}/reset-password?token=${token}\n\nIf you did not ask for this, ignore this email.`,
    );
  }
  return json({ ok: true });
});
