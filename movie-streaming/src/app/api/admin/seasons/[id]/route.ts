import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { seasonSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const input = await parseBody(req, seasonSchema);
  await db.season.update({ where: { id }, data: { number: input.number, title: input.title || null } });
  revalidatePath("/", "layout");
  return json({ ok: true });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  await db.season.delete({ where: { id } });
  revalidatePath("/", "layout");
  return json({ ok: true });
});
