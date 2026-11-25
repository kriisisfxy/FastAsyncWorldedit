import { handler, HttpError, json, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { progressSchema } from "@/lib/validation";
import { saveProgress } from "@/services/library";

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const input = await parseBody(req, progressSchema);
  const row = await saveProgress(user.id, input);
  if (!row) throw new HttpError(404, "Title not found.");
  return json({ ok: true, completed: row.completed });
});
