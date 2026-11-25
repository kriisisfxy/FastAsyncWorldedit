import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/utils";
import { genreSchema } from "@/lib/validation";

export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const { name } = await parseBody(req, genreSchema);
  const genre = await db.genre.create({ data: { name, slug: slugify(name) } });
  revalidatePath("/", "layout");
  return json(genre, 201);
});
