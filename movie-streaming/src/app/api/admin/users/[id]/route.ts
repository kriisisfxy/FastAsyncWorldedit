import { db } from "@/lib/db";
import { handler, HttpError, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { adminUserSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const me = await requireAdmin();
  const { id } = await params;
  const data = await parseBody(req, adminUserSchema);
  if (id === me.id && (data.role === "USER" || data.disabled)) {
    throw new HttpError(400, "You cannot demote or disable your own account.");
  }
  if (data.role === "USER") {
    const admins = await db.user.count({ where: { role: "ADMIN", disabled: false } });
    if (admins <= 1) throw new HttpError(400, "At least one administrator must remain.");
  }
  await db.user.update({ where: { id }, data });
  return json({ ok: true });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const me = await requireAdmin();
  const { id } = await params;
  if (id === me.id) throw new HttpError(400, "You cannot delete your own account here.");
  await db.user.delete({ where: { id } });
  return json({ ok: true });
});
