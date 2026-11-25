import { auth } from "@/auth";
import { HttpError } from "./http";

export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Server-side guard for API routes (defence in depth on top of middleware). */
export async function requireUser() {
  const user = await currentUser();
  if (!user?.id) throw new HttpError(401, "Sign in required.");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new HttpError(403, "Administrator access required.");
  return user;
}
