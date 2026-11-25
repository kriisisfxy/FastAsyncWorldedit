/**
 * Generates original demo video clips with ffmpeg so the player can be exercised offline,
 * without depending on third-party sample hosts. Output goes to public/demo/video/.
 * If ffmpeg is not installed the seed continues without playable demo sources.
 */
import { execFileSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import path from "path";

export type Clip = { name: string; title: string; seconds: number; c0: string; c1: string; tone: number };

export const CLIPS: Clip[] = [
  { name: "test-reel", title: "NOCTURNE  TEST REEL", seconds: 90, c0: "0x5b2bd9", c1: "0x0b0718", tone: 220 },
  { name: "night-shift-1", title: "NIGHT SHIFT  ·  EPISODE 1", seconds: 40, c0: "0x1d4ed8", c1: "0x050a1a", tone: 262 },
  { name: "night-shift-2", title: "NIGHT SHIFT  ·  EPISODE 2", seconds: 40, c0: "0xbe185d", c1: "0x14040c", tone: 294 },
  { name: "night-shift-3", title: "NIGHT SHIFT  ·  EPISODE 3", seconds: 40, c0: "0x0f766e", c1: "0x02110f", tone: 330 },
];

export function hasFfmpeg() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Returns the public URL of each generated MP4 (and an HLS playlist for the first clip). */
export function generateClips(publicDir: string) {
  const dir = path.join(publicDir, "demo", "video");
  mkdirSync(dir, { recursive: true });
  for (const c of CLIPS) {
    const mp4 = path.join(dir, `${c.name}.mp4`);
    if (existsSync(mp4)) continue;
    const text = `drawtext=font='DejaVu Sans':fontsize=54:fontcolor=white:text='${c.title}':x=(w-tw)/2:y=(h-th)/2-30,` +
      `drawtext=font='DejaVu Sans':fontsize=30:fontcolor=white@0.7:text='%{pts\\:hms}':x=(w-tw)/2:y=(h/2)+40`;
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y",
      "-f", "lavfi", "-i", `gradients=s=1280x720:c0=${c.c0}:c1=${c.c1}:speed=0.02:duration=${c.seconds}:rate=24`,
      "-f", "lavfi", "-i", `sine=frequency=${c.tone}:duration=${c.seconds}`,
      "-vf", text, "-af", "volume=0.06",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "30", "-pix_fmt", "yuv420p", "-g", "48",
      "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", "-shortest", mp4,
    ]);
  }
  const hlsDir = path.join(dir, "test-reel-hls");
  if (!existsSync(path.join(hlsDir, "index.m3u8"))) {
    mkdirSync(hlsDir, { recursive: true });
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y", "-i", path.join(dir, "test-reel.mp4"),
      "-c", "copy", "-f", "hls", "-hls_time", "6", "-hls_playlist_type", "vod",
      "-hls_segment_filename", path.join(hlsDir, "seg%03d.ts"), path.join(hlsDir, "index.m3u8"),
    ]);
  }
  return {
    mp4: (name: string) => `/demo/video/${name}.mp4`,
    hls: "/demo/video/test-reel-hls/index.m3u8",
  };
}
