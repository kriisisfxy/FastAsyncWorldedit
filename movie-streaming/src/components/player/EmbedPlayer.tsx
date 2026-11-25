"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SkipIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import type { NextUp, PlayerSource, ProgressTarget } from "./types";
import { saveRemote } from "./progress";

/**
 * Hosts a provider's official embed player (e.g. Videa) in our player shell.
 * The provider's own controls run inside the iframe; cross-origin embeds do not expose playback time,
 * so we record a "started watching" entry for history but cannot resume at an exact second.
 */
export function EmbedPlayer({
  source, header, target, signedIn, next, onTryOther,
}: { source: PlayerSource; header: React.ReactNode; target: ProgressTarget; signedIn: boolean; next?: NextUp | null; onTryOther?: () => void }) {
  const [state, setState] = useState<"loading" | "ready" | "slow">("loading");
  const [attempt, setAttempt] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setState("loading");
    const t = setTimeout(() => setState((s) => (s === "loading" ? "slow" : s)), 15000);
    return () => clearTimeout(t);
  }, [attempt]);

  useEffect(() => {
    if (signedIn) saveRemote(target, 1, 0);
  }, [signedIn, target]);

  return (
    <div className="flex min-h-dvh flex-col bg-black">
      <div className="px-4 py-3 sm:px-6">{header}</div>
      <div className="relative flex flex-1 items-center justify-center px-0 pb-4 sm:px-6">
        <div className="relative aspect-video w-full max-w-[min(100%,calc((100dvh-140px)*16/9))] overflow-hidden bg-ink sm:rounded-2xl sm:ring-1 sm:ring-white/10">
          <iframe
            key={attempt}
            ref={frame}
            src={source.url}
            title="Video player"
            className="absolute inset-0 size-full"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setState("ready")}
          />
          {state !== "ready" && (
            <div className="absolute inset-0 grid place-items-center bg-ink/90 text-center">
              {state === "loading" ? (
                <div className="flex flex-col items-center gap-3 text-soft"><Spinner className="size-8" /> Loading player…</div>
              ) : (
                <div className="px-6">
                  <p className="font-semibold">The player is taking a long time to load.</p>
                  <p className="mt-1 text-sm text-mute">The video provider may be unavailable, or the video may have been removed.</p>
                  <div className="mt-5 flex justify-center gap-2">
                    <button className="btn-primary" onClick={() => setAttempt((a) => a + 1)}>Retry</button>
                    {onTryOther && <button className="btn-ghost" onClick={onTryOther}>Try another source</button>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 px-4 pb-6 text-xs text-mute sm:px-6">
        <span>Playing through the provider’s embedded player. Use its controls for volume, quality and fullscreen.</span>
        {next && (
          <Link href={next.href} className="btn-ghost ml-auto h-10 text-sm">
            <SkipIcon className="size-4" /> {next.label}
          </Link>
        )}
      </div>
    </div>
  );
}
