import type { VideoProviderModule } from "./types";

/**
 * Videa (videa.hu) integration.
 *
 * Videa does not publish a documented public API that we could verify, so this module does NOT call any
 * Videa endpoint and does NOT extract stream URLs. It only renders Videa's own embeddable player in an
 * iframe, using the embed address an administrator copies from the "Embed"/"Beágyazás" option on
 * videa.hu. That keeps playback inside Videa's player (its ads, access rules and takedowns still apply).
 *
 * Accepted input: the embed iframe HTML, or its src URL. The URL must be https and on videa.hu.
 */
const ALLOWED_HOSTS = new Set(["videa.hu", "www.videa.hu"]);

function extractSrc(input: string) {
  const trimmed = input.trim();
  const m = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  return (m ? m[1] : trimmed).replace(/&amp;/g, "&");
}

export const videaProvider: VideoProviderModule = {
  id: "VIDEA",
  name: "Videa (official embed)",
  adminHint:
    "On videa.hu open the video, choose Embed (Beágyazás) and paste the iframe code or its src URL. " +
    "Only add videos you have the rights to publish.",
  frameHosts: ["https://videa.hu", "https://www.videa.hu"],
  normalize(input) {
    const src = extractSrc(input);
    let url: URL;
    try {
      url = new URL(src);
    } catch {
      throw new Error("Paste the Videa embed code or embed URL.");
    }
    if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
      throw new Error("The embed URL must be an https://videa.hu address.");
    }
    if (url.username || url.password) throw new Error("Invalid embed URL.");
    return url.toString();
  },
  resolve(ref) {
    return { kind: "embed", url: ref, trackable: false };
  },
};
