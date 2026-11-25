import { handler, HttpError, json } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { storeImage } from "@/lib/storage";

const FOLDERS = ["posters", "backdrops", "stills", "avatars"] as const;

export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const form = await req.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "posters") as (typeof FOLDERS)[number];
  if (!FOLDERS.includes(folder)) throw new HttpError(400, "Unknown folder.");
  if (!(file instanceof File)) throw new HttpError(400, "Choose an image.");
  try {
    return json({ url: await storeImage(file, folder) });
  } catch (e) {
    throw new HttpError(422, (e as Error).message);
  }
});
