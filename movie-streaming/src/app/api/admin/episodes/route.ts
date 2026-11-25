import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { episodeSchema } from "@/lib/validation";
import { buildSources } from "@/services/admin";

export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const input = await parseBody(req, episodeSchema);
  const ep = await db.episode.create({
    data: {
      seasonId: input.seasonId, number: input.number, title: input.title,
      description: input.description || null, runtime: input.runtime ?? null, stillUrl: input.stillUrl ?? null,
      sources: { create: buildSources(input.sources) },
    },
  });
  revalidatePath("/", "layout");
  return json({ id: ep.id }, 201);
});
