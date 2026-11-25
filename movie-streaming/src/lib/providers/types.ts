/**
 * A video provider turns a stored VideoSource.ref into something the player can render.
 *
 * - "file":  a media URL our own <video> element plays (full custom controls, progress tracking, subtitles).
 * - "embed": an iframe URL from a provider's official embed player. The provider's own controls are
 *            used inside the iframe; we never scrape or re-host the underlying stream.
 */
export type PlaybackKind = "file" | "embed";

export interface ResolvedPlayback {
  kind: PlaybackKind;
  url: string;
  mime?: "video/mp4" | "application/x-mpegURL" | "video/webm";
  /** Whether our player can read time/progress (only for files). */
  trackable: boolean;
}

export interface VideoProviderModule {
  id: "VIDEA" | "DIRECT";
  name: string;
  /** Help text for administrators. */
  adminHint: string;
  /** Normalise admin input. Throws an Error with a readable message when it is not acceptable. */
  normalize(input: string): string;
  resolve(ref: string): ResolvedPlayback;
  /** Hosts this provider needs in frame-src / media-src. */
  frameHosts: string[];
}
