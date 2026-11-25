import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  return schema.parse(body);
}

/** Wraps a route handler so validation, auth and unexpected errors return clean JSON. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      const req = args[0];
      if (req instanceof Request && req.method !== "GET" && req.method !== "HEAD") assertSameOrigin(req);
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      if (err instanceof ZodError) {
        return json({ error: err.issues[0]?.message ?? "Invalid input", issues: err.issues }, 422);
      }
      const code = (err as { code?: string })?.code;
      if (code === "P2002") return json({ error: "That value is already in use." }, 409);
      if (code === "P2025") return json({ error: "Not found." }, 404);
      console.error(err);
      return json({ error: "Something went wrong." }, 500);
    }
  };
}

/** Rejects cross-site state-changing requests (CSRF defence in addition to SameSite cookies). */
function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origin).host !== host) throw new HttpError(403, "Cross-site request blocked.");
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(403, "Cross-site request blocked.");
  }
}
