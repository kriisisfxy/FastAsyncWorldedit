import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { episodeSchema } from "@/lib/validation";
import { buildSources } from "@/services/admin";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const input = await parseBody(req, episodeSchema);
  const sources = buildSources(input.sources);
  await db.$transaction([
    db.videoSource.deleteMany({ where: { episodeId: id } }),
    db.episode.update({
      where: { id },
      data: {
        number: input.number, title: input.title, description: input.description || null,
        runtime: input.runtime ?? null, stillUrl: input.stillUrl ?? null,
        sources: { create: sources },
      },
    }),
  ]);
  revalidatePath("/", "layout");
  return json({ ok: true });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  await db.episode.delete({ where: { id } });
  revalidatePath("/", "layout");
  return json({ ok: true });
});
