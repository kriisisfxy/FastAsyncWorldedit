import { handler, json } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { quickSearch } from "@/services/catalog";

export const GET = handler(async (req: Request) => {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (q.length < 2) return json({ movies: [], series: [], actors: [] });
  if (!rateLimit(clientKey(req, "search"), 120, 60 * 1000)) return json({ error: "Slow down." }, 429);
  return json(await quickSearch(q), { headers: { "Cache-Control": "public, max-age=30" } });
});
