import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { handler, json } from "@/lib/http";
import { requireAdmin } from "@/lib/session";

export const DELETE = handler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  await db.genre.delete({ where: { id } });
  revalidatePath("/", "layout");
  return json({ ok: true });
});
