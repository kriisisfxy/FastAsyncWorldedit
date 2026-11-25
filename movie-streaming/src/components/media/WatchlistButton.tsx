"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckIcon, PlusIcon } from "@/components/ui/Icons";

export function WatchlistButton({ movieId, seriesId, initial, signedIn }: { movieId?: string; seriesId?: string; initial: boolean; signedIn: boolean }) {
  const [inList, setInList] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggle = () => {
    if (!signedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setError(null);
    setInList((v) => !v); // optimistic
    start(async () => {
      const res = await fetch("/api/me/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movieId ? { movieId } : { seriesId }),
      });
      if (!res.ok) {
        setInList((v) => !v);
        setError("Could not update your list.");
        return;
      }
      setInList((await res.json()).inList);
      router.refresh();
    });
  };

  return (
    <span className="inline-flex flex-col">
      <button onClick={toggle} disabled={pending} className="btn-ghost h-12 px-6 text-base" aria-pressed={inList}>
        {inList ? <CheckIcon className="size-5 text-violet-2" /> : <PlusIcon className="size-5" />}
        {inList ? "In my list" : "My list"}
      </button>
      {error && <span className="mt-1 text-xs text-red-300" role="alert">{error}</span>}
    </span>
  );
}
