import { db } from "@/lib/db";
import { handler, HttpError, json, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { ratingSchema } from "@/lib/validation";
import { communityRating } from "@/services/library";

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const { movieId, value } = await parseBody(req, ratingSchema);
  if (!(await db.movie.count({ where: { id: movieId, published: true } }))) throw new HttpError(404, "Title not found.");
  await db.rating.upsert({
    where: { userId_movieId: { userId: user.id, movieId } },
    update: { value },
    create: { userId: user.id, movieId, value },
  });
  return json({ value, community: await communityRating(movieId) });
});
