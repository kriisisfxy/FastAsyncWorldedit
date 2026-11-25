import type { VideoProviderModule } from "./types";

/**
 * Direct media files the site is allowed to stream: MP4/WebM files or HLS (.m3u8) playlists hosted by you,
 * a CDN you control, or openly licensed sources. Played by our own player with full controls.
 */
export const directProvider: VideoProviderModule = {
  id: "DIRECT",
  name: "Direct file (MP4 / WebM / HLS)",
  adminHint: "An https URL to an .mp4, .webm or .m3u8 file you are licensed to stream.",
  frameHosts: [],
  normalize(input) {
    const raw = input.trim();
    if (raw.startsWith("/")) return raw;
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new Error("Enter a valid https URL to a video file.");
    }
    if (url.protocol !== "https:") throw new Error("Video files must be served over https.");
    return url.toString();
  },
  resolve(ref) {
    const path = ref.split("?")[0].toLowerCase();
    const mime = path.endsWith(".m3u8") ? "application/x-mpegURL" : path.endsWith(".webm") ? "video/webm" : "video/mp4";
    return { kind: "file", url: ref, mime, trackable: true };
  },
};
