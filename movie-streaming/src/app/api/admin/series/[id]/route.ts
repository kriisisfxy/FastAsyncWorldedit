import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { seriesSchema } from "@/lib/validation";
import { updateSeries } from "@/services/admin";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const s = await updateSeries(id, await parseBody(req, seriesSchema));
  revalidatePath("/", "layout");
  return json({ id: s.id, slug: s.slug });
});

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const data = await parseBody(req, z.object({ featured: z.boolean().optional(), published: z.boolean().optional() }));
  await db.series.update({ where: { id }, data });
  revalidatePath("/", "layout");
  return json({ ok: true });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  await db.series.delete({ where: { id } });
  revalidatePath("/", "layout");
  return json({ ok: true });
});
