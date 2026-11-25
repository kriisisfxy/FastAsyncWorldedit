import { handler, HttpError, json, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { watchlistSchema } from "@/lib/validation";
import { toggleWatchlist } from "@/services/library";

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const target = await parseBody(req, watchlistSchema);
  const inList = await toggleWatchlist(user.id, target);
  if (inList === null) throw new HttpError(404, "Title not found.");
  return json({ inList });
});
