"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">The reel slipped.</h1>
        <p className="mx-auto mt-3 max-w-md text-mute">We couldn’t load this page. Try again, or head back home.</p>
        <div className="mt-7 flex justify-center gap-3">
          <button onClick={reset} className="btn-violet">Try again</button>
          <Link href="/" className="btn-ghost">Home</Link>
        </div>
        {error.digest && <p className="mt-6 text-xs text-mute/60">Reference: {error.digest}</p>}
      </div>
    </div>
  );
}
