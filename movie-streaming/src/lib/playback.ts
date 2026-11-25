import type { PlayerSource } from "@/components/player/types";
import { resolveSource } from "./providers";

type DbSource = {
  id: string; provider: string; ref: string; label: string; quality: string | null;
  subtitles: { id: string; language: string; label: string; url: string }[];
};

/** Resolves stored sources through their provider modules; skips any that no longer validate. */
export function toPlayerSources(sources: DbSource[]): PlayerSource[] {
  return sources.flatMap((s) => {
    try {
      const r = resolveSource(s);
      return [{ id: s.id, label: s.label, quality: s.quality, kind: r.kind, url: r.url, mime: r.mime, subtitles: r.kind === "file" ? s.subtitles : [] }];
    } catch {
      return [];
    }
  });
}
