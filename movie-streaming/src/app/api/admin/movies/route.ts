import { revalidatePath } from "next/cache";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { movieSchema } from "@/lib/validation";
import { createMovie } from "@/services/admin";

export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const movie = await createMovie(await parseBody(req, movieSchema));
  revalidatePath("/", "layout");
  return json({ id: movie.id, slug: movie.slug }, 201);
});
