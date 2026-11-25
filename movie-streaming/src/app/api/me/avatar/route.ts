import { db } from "@/lib/db";
import { handler, HttpError, json } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { storeImage } from "@/lib/storage";

export const POST = handler(async (req: Request) => {
  const me = await requireUser();
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Choose an image.");
  let url: string;
  try {
    url = await storeImage(file, "avatars");
  } catch (e) {
    throw new HttpError(422, (e as Error).message);
  }
  await db.user.update({ where: { id: me.id }, data: { avatarUrl: url } });
  return json({ url });
});
