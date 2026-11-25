import { revalidatePath } from "next/cache";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { seriesSchema } from "@/lib/validation";
import { createSeries } from "@/services/admin";

export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const s = await createSeries(await parseBody(req, seriesSchema));
  revalidatePath("/", "layout");
  return json({ id: s.id, slug: s.slug }, 201);
});
