import type { ProgressTarget } from "./types";

const key = (t: ProgressTarget) => `nocturne:pos:${"movieId" in t ? "m:" + t.movieId : "e:" + t.episodeId}`;

/** Local fallback so guests also resume where they stopped. */
export function readLocal(t: ProgressTarget) {
  try {
    return Number(localStorage.getItem(key(t))) || 0;
  } catch {
    return 0;
  }
}

export function writeLocal(t: ProgressTarget, sec: number, duration: number) {
  try {
    if (duration && sec / duration > 0.92) localStorage.removeItem(key(t));
    else localStorage.setItem(key(t), String(Math.floor(sec)));
  } catch {
    /* storage unavailable */
  }
}

/** Saves to the account. Uses sendBeacon when the page is closing so the last position is not lost. */
export function saveRemote(t: ProgressTarget, positionSec: number, durationSec: number, closing = false) {
  const body = JSON.stringify({ ...t, positionSec: Math.floor(positionSec), durationSec: Math.floor(durationSec) });
  if (closing && navigator.sendBeacon) {
    navigator.sendBeacon("/api/me/progress", new Blob([body], { type: "application/json" }));
    return;
  }
  fetch("/api/me/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
}
