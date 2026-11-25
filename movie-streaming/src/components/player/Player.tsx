"use client";

import Link from "next/link";
import { useState } from "react";
import { BackIcon } from "@/components/ui/Icons";
import { EmbedPlayer } from "./EmbedPlayer";
import { FilePlayer } from "./FilePlayer";
import type { PlayerSource, NextUp, ProgressTarget } from "./types";

/**
 * Chooses the right renderer for the selected source:
 *  - "file"  → our own <video> player with full controls, resume and subtitles
 *  - "embed" → the provider's official embedded player (e.g. Videa) inside our player shell
 */
export function Player({
  title, subtitle, backHref, sources, target, startAt, signedIn, next, poster,
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  sources: PlayerSource[];
  target: ProgressTarget;
  startAt: number;
  signedIn: boolean;
  next?: NextUp | null;
  poster?: string | null;
}) {
  const [index, setIndex] = useState(0);
  const source = sources[index];

  if (!source) {
    return (
      <div className="grid min-h-dvh place-items-center bg-black px-6 text-center">
        <div>
          <p className="font-display text-2xl font-bold">This title isn’t available to stream yet.</p>
          <p className="mt-2 text-mute">No video source has been added. Check back soon.</p>
          <Link href={backHref} className="btn-ghost mt-6">Back to details</Link>
        </div>
      </div>
    );
  }

  const switcher =
    sources.length > 1 ? (
      <label className="flex items-center gap-2 text-sm text-soft">
        <span className="hidden sm:inline">Source</span>
        <select
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="h-9 rounded-full border border-white/15 bg-black/50 px-3 text-sm text-white outline-none backdrop-blur focus:border-violet"
        >
          {sources.map((s, i) => (
            <option key={s.id} value={i}>
              {s.label}{s.quality ? ` · ${s.quality}` : ""}
            </option>
          ))}
        </select>
      </label>
    ) : null;

  const header = (
    <div className="flex items-center gap-3">
      <Link href={backHref} className="grid size-11 shrink-0 place-items-center rounded-full bg-black/40 backdrop-blur transition hover:bg-white/20" aria-label="Back">
        <BackIcon className="size-5" />
      </Link>
      <div className="min-w-0">
        <p className="truncate font-display text-lg font-bold leading-tight sm:text-xl">{title}</p>
        {subtitle && <p className="truncate text-sm text-soft">{subtitle}</p>}
      </div>
      <div className="ml-auto">{switcher}</div>
    </div>
  );

  const fallback = sources.length > 1 ? () => setIndex((i) => (i + 1) % sources.length) : undefined;

  return source.kind === "file" ? (
    <FilePlayer key={source.id} source={source} header={header} target={target} startAt={startAt} signedIn={signedIn} next={next} poster={poster} onTryOther={fallback} />
  ) : (
    <EmbedPlayer key={source.id} source={source} header={header} target={target} signedIn={signedIn} next={next} onTryOther={fallback} />
  );
}
