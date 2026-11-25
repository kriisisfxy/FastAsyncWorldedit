import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { seasonSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const input = await parseBody(req, seasonSchema);
  const season = await db.season.create({ data: { seriesId: id, number: input.number, title: input.title || null } });
  revalidatePath("/", "layout");
  return json({ id: season.id }, 201);
});
