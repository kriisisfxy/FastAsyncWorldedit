import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { movieSchema } from "@/lib/validation";
import { updateMovie } from "@/services/admin";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const movie = await updateMovie(id, await parseBody(req, movieSchema));
  revalidatePath("/", "layout");
  return json({ id: movie.id, slug: movie.slug });
});

/** Quick toggles from the list view (featured / published). */
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const data = await parseBody(req, z.object({ featured: z.boolean().optional(), published: z.boolean().optional() }));
  await db.movie.update({ where: { id }, data });
  revalidatePath("/", "layout");
  return json({ ok: true });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  await db.movie.delete({ where: { id } });
  revalidatePath("/", "layout");
  return json({ ok: true });
});
