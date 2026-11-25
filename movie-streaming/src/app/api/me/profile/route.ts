import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { handler, HttpError, json, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { profileSchema } from "@/lib/validation";

export const PATCH = handler(async (req: Request) => {
  const me = await requireUser();
  const input = await parseBody(req, profileSchema);
  const data: { name?: string; passwordHash?: string } = {};
  if (input.name) data.name = input.name;
  if (input.newPassword) {
    const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
    if (!input.currentPassword || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      throw new HttpError(400, "Your current password is incorrect.");
    }
    data.passwordHash = await bcrypt.hash(input.newPassword, 12);
  }
  await db.user.update({ where: { id: me.id }, data });
  return json({ ok: true });
});
