"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CaptionsIcon, ExitFullscreenIcon, Forward10, FullscreenIcon, MuteIcon, PauseIcon, PlayIcon, Rewind10, SkipIcon, VolumeIcon,
} from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { cn, formatTime } from "@/lib/utils";
import { readLocal, saveRemote, writeLocal } from "./progress";
import type { NextUp, PlayerSource, ProgressTarget } from "./types";

const SAVE_EVERY_MS = 15000;
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

type Props = {
  source: PlayerSource;
  header: React.ReactNode;
  target: ProgressTarget;
  startAt: number;
  signedIn: boolean;
  next?: NextUp | null;
  poster?: string | null;
  onTryOther?: () => void;
};

export function FilePlayer({ source, header, target, startAt, signedIn, next, poster, onTryOther }: Props) {
  const router = useRouter();
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSave = useRef(0);
  const lastTap = useRef<{ t: number; x: number }>({ t: 0, x: 0 });

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [showUi, setShowUi] = useState(true);
  const [hover, setHover] = useState<{ x: number; t: number } | null>(null);
  const [captions, setCaptions] = useState<string>("off");
  const [menu, setMenu] = useState<null | "cc" | "speed">(null);
  const [speed, setSpeed] = useState(1);
  const [resumeFrom, setResumeFrom] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // ---- source loading (MP4/WebM natively, HLS natively on Safari or via hls.js elsewhere) ----
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    setError(null);
    setWaiting(true);
    let hls: { destroy(): void } | null = null;
    let cancelled = false;
    const isHls = source.mime === "application/x-mpegURL";
    if (isHls && !v.canPlayType("application/vnd.apple.mpegurl")) {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) return setError("This browser cannot play adaptive streams.");
        const h = new Hls({ capLevelToPlayerSize: true });
        h.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) setError("The stream could not be loaded.");
        });
        h.loadSource(source.url);
        h.attachMedia(v);
        hls = h;
      });
    } else {
      v.src = source.url;
      v.load();
    }
    return () => {
      cancelled = true;
      hls?.destroy();
      v.removeAttribute("src");
      v.load();
    };
  }, [source.url, source.mime, attempt]);

  // ---- preferences + resume point ----
  useEffect(() => {
    try {
      const vol = Number(localStorage.getItem("nocturne:volume"));
      if (vol >= 0 && vol <= 1 && localStorage.getItem("nocturne:volume") !== null) setVolume(vol);
      setMuted(localStorage.getItem("nocturne:muted") === "1");
      const cc = localStorage.getItem("nocturne:cc");
      if (cc && source.subtitles.some((s) => s.language === cc)) setCaptions(cc);
    } catch {}
    setResumeFrom(Math.max(startAt, signedIn ? 0 : readLocal(target)));
  }, [startAt, signedIn, target, source.subtitles]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
    try {
      localStorage.setItem("nocturne:volume", String(volume));
      localStorage.setItem("nocturne:muted", muted ? "1" : "0");
    } catch {}
  }, [volume, muted]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    for (const track of Array.from(v.textTracks)) track.mode = track.language === captions ? "showing" : "disabled";
    try {
      localStorage.setItem("nocturne:cc", captions);
    } catch {}
  }, [captions, duration]);

  useEffect(() => {
    if (video.current) video.current.playbackRate = speed;
  }, [speed]);

  // ---- progress saving ----
  const persist = useCallback(
    (closing = false) => {
      const v = video.current;
      if (!v || !v.duration || !Number.isFinite(v.duration)) return;
      writeLocal(target, v.currentTime, v.duration);
      if (signedIn) saveRemote(target, v.currentTime, v.duration, closing);
      lastSave.current = Date.now();
    },
    [signedIn, target],
  );

  useEffect(() => {
    const onHide = () => persist(true);
    const onVisibility = () => document.visibilityState === "hidden" && onHide();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      persist(true);
    };
  }, [persist]);

  // ---- controls visibility ----
  const poke = useCallback(() => {
    setShowUi(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!video.current?.paused) {
        setShowUi(false);
        setMenu(null);
      }
    }, 2800);
  }, []);

  const toggle = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => setError("Playback was blocked. Press play to start."));
    else v.pause();
    poke();
  }, [poke]);

  const seekBy = useCallback((d: number) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, v.currentTime + d), v.duration || 0);
    setFlash(d > 0 ? `+${d}s` : `${d}s`);
    setTimeout(() => setFlash(null), 600);
    poke();
  }, [poke]);

  const toggleFull = useCallback(async () => {
    const el = wrap.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    const v = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (el?.requestFullscreen) await el.requestFullscreen();
      else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else v?.webkitEnterFullscreen?.(); // iOS Safari
    } catch {}
  }, []);

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // ---- keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,select,textarea")) return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "k") { e.preventDefault(); toggle(); }
      else if (k === "arrowright" || k === "l") { e.preventDefault(); seekBy(10); }
      else if (k === "arrowleft" || k === "j") { e.preventDefault(); seekBy(-10); }
      else if (k === "arrowup") { e.preventDefault(); setVolume((x) => Math.min(1, x + 0.1)); setMuted(false); poke(); }
      else if (k === "arrowdown") { e.preventDefault(); setVolume((x) => Math.max(0, x - 0.1)); poke(); }
      else if (k === "m") setMuted((m) => !m);
      else if (k === "f") toggleFull();
      else if (k === "c" && source.subtitles.length) setCaptions((c) => (c === "off" ? source.subtitles[0].language : "off"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, seekBy, toggleFull, poke, source.subtitles]);

  // ---- next episode countdown ----
  useEffect(() => {
    if (countdown === null || !next) return;
    if (countdown <= 0) {
      router.push(next.href);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, next, router]);

  // ---- timeline scrubbing (mouse + touch via pointer events) ----
  const timeAt = (clientX: number) => {
    const r = bar.current!.getBoundingClientRect();
    const x = Math.min(Math.max(0, clientX - r.left), r.width);
    return { x, t: (x / r.width) * (duration || 0) };
  };
  const onScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!duration) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const move = (ev: PointerEvent) => {
      const { x, t } = timeAt(ev.clientX);
      setHover({ x, t });
      setTime(t);
      if (video.current) video.current.currentTime = t;
    };
    move(e.nativeEvent);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setHover(null);
      poke();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // Tap handling on touch: single tap toggles UI, double tap on the sides seeks.
  const onSurfacePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return toggle();
    const now = Date.now();
    const r = wrap.current!.getBoundingClientRect();
    const rel = (e.clientX - r.left) / r.width;
    if (now - lastTap.current.t < 300) {
      if (rel < 0.35) seekBy(-10);
      else if (rel > 0.65) seekBy(10);
      else toggle();
      lastTap.current = { t: 0, x: 0 };
    } else {
      lastTap.current = { t: now, x: e.clientX };
      if (showUi && !video.current?.paused) setShowUi(false);
      else poke();
    }
  };

  const remaining = duration - time;
  const showNextCard = !!next && duration > 0 && (remaining < 20 || countdown !== null);
  const needsCors = source.subtitles.some((s) => /^https?:/i.test(s.url));

  return (
    <div
      ref={wrap}
      className={cn("relative h-dvh w-full select-none overflow-hidden bg-black", !showUi && playing && "cursor-none")}
      onPointerMove={(e) => e.pointerType === "mouse" && poke()}
    >
      <video
        ref={video}
        className="absolute inset-0 size-full object-contain"
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        crossOrigin={needsCors ? "anonymous" : undefined}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          setDuration(v.duration);
          if (resumeFrom > 5 && resumeFrom < v.duration - 30) v.currentTime = resumeFrom;
          v.play().catch(() => setWaiting(false));
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setTime(v.currentTime);
          if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
          if (Date.now() - lastSave.current > SAVE_EVERY_MS) persist();
        }}
        onPlay={() => { setPlaying(true); poke(); }}
        onPause={() => { setPlaying(false); setShowUi(true); persist(); }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => setWaiting(false)}
        onEnded={() => {
          persist();
          if (next) setCountdown((c) => c ?? 5);
        }}
        onError={() => setError("This video could not be loaded. The file may have moved or your connection dropped.")}
      >
        {source.subtitles.map((s) => (
          <track key={s.id} kind="subtitles" src={s.url} srcLang={s.language} label={s.label} />
        ))}
      </video>

      {/* click / tap surface */}
      <div className="absolute inset-0" onPointerUp={onSurfacePointer} onDoubleClick={(e) => { e.preventDefault(); toggleFull(); }} />

      {/* loading */}
      {waiting && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Spinner className="size-12 border-[3px]" />
        </div>
      )}

      {/* seek flash */}
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 px-5 py-2.5 font-display text-xl font-bold backdrop-blur">
            {flash}
          </motion.div>
        )}
      </AnimatePresence>

      {/* error */}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/85 px-6 text-center">
          <div role="alert">
            <p className="font-display text-xl font-bold">Playback problem</p>
            <p className="mx-auto mt-2 max-w-md text-soft">{error}</p>
            <div className="mt-6 flex justify-center gap-2">
              <button className="btn-primary" onClick={() => { setResumeFrom(time); setAttempt((a) => a + 1); }}>Retry</button>
              {onTryOther && <button className="btn-ghost" onClick={onTryOther}>Try another source</button>}
            </div>
          </div>
        </div>
      )}

      {/* next episode */}
      <AnimatePresence>
        {showNextCard && next && (
          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} className="absolute bottom-28 right-4 z-20 w-72 rounded-2xl border border-white/10 bg-ink-2/90 p-4 backdrop-blur-xl sm:right-8">
            <p className="text-xs font-semibold text-violet-2">Up next</p>
            <p className="mt-1 truncate font-semibold">{next.title}</p>
            <div className="mt-3 flex gap-2">
              <Link href={next.href} className="btn-primary h-10 flex-1 text-sm"><SkipIcon className="size-4" />{countdown !== null ? `Playing in ${countdown}` : "Play now"}</Link>
              {countdown !== null && <button className="btn-ghost h-10 text-sm" onClick={() => setCountdown(null)}>Cancel</button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* chrome */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex flex-col justify-between"
        animate={{ opacity: showUi || !playing ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="pointer-events-auto bg-gradient-to-b from-black/80 to-transparent px-4 pb-12 pt-3 sm:px-6">{header}</div>

        <div className={cn("bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-16 sm:px-6", showUi || !playing ? "pointer-events-auto" : "pointer-events-none")}>
          {/* timeline */}
          <div
            ref={bar}
            className="group/bar relative flex h-6 cursor-pointer touch-none items-center"
            onPointerDown={onScrub}
            onPointerMove={(e) => duration && e.pointerType === "mouse" && setHover(timeAt(e.clientX))}
            onPointerLeave={() => setHover(null)}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration)}
            aria-valuenow={Math.floor(time)}
            aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
            tabIndex={0}
          >
            <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/20 transition-[height] group-hover/bar:h-1.5">
              <div className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }} />
              <div className="absolute inset-y-0 left-0 bg-violet-2" style={{ width: `${duration ? (time / duration) * 100 : 0}%` }} />
            </div>
            <div className="absolute size-3.5 -translate-x-1/2 rounded-full bg-white shadow-lg transition-transform group-hover/bar:scale-125" style={{ left: `${duration ? (time / duration) * 100 : 0}%` }} />
            {hover && (
              <div className="absolute -top-8 -translate-x-1/2 rounded-md bg-black/80 px-2 py-1 text-xs font-semibold tabular-nums" style={{ left: hover.x }}>
                {formatTime(hover.t)}
              </div>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1 sm:gap-2">
            <CtlButton label={playing ? "Pause (k)" : "Play (k)"} onClick={toggle}>
              {playing ? <PauseIcon className="size-6" /> : <PlayIcon className="size-6" />}
            </CtlButton>
            <CtlButton label="Back 10 seconds" onClick={() => seekBy(-10)}><Rewind10 className="size-6" /></CtlButton>
            <CtlButton label="Forward 10 seconds" onClick={() => seekBy(10)}><Forward10 className="size-6" /></CtlButton>

            <div className="group/vol flex items-center">
              <CtlButton label={muted ? "Unmute (m)" : "Mute (m)"} onClick={() => setMuted((m) => !m)}>
                {muted || volume === 0 ? <MuteIcon className="size-6" /> : <VolumeIcon className="size-6" />}
              </CtlButton>
              <input
                type="range" min={0} max={1} step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
                aria-label="Volume"
                className="hidden h-1 w-0 cursor-pointer accent-violet-2 transition-all duration-300 group-hover/vol:w-24 focus:w-24 sm:block"
              />
            </div>

            <span className="ml-1 text-[13px] tabular-nums text-soft sm:text-sm">
              {formatTime(time)} <span className="text-mute">/ {formatTime(duration)}</span>
            </span>

            <div className="relative ml-auto flex items-center gap-1">
              <div className="relative">
                <CtlButton label="Playback speed" onClick={() => setMenu((m) => (m === "speed" ? null : "speed"))}>
                  <span className="text-sm font-bold">{speed}×</span>
                </CtlButton>
                {menu === "speed" && (
                  <Menu>
                    {SPEEDS.map((s) => (
                      <MenuItem key={s} active={s === speed} onClick={() => { setSpeed(s); setMenu(null); }}>{s === 1 ? "Normal" : `${s}×`}</MenuItem>
                    ))}
                  </Menu>
                )}
              </div>
              {source.subtitles.length > 0 && (
                <div className="relative">
                  <CtlButton label="Subtitles (c)" onClick={() => setMenu((m) => (m === "cc" ? null : "cc"))} active={captions !== "off"}>
                    <CaptionsIcon className="size-6" />
                  </CtlButton>
                  {menu === "cc" && (
                    <Menu>
                      <MenuItem active={captions === "off"} onClick={() => { setCaptions("off"); setMenu(null); }}>Off</MenuItem>
                      {source.subtitles.map((s) => (
                        <MenuItem key={s.id} active={captions === s.language} onClick={() => { setCaptions(s.language); setMenu(null); }}>{s.label}</MenuItem>
                      ))}
                    </Menu>
                  )}
                </div>
              )}
              {next && (
                <Link href={next.href} className="grid size-11 place-items-center rounded-full transition hover:bg-white/15" aria-label={next.label} title={next.label}>
                  <SkipIcon className="size-6" />
                </Link>
              )}
              <CtlButton label={full ? "Exit fullscreen (f)" : "Fullscreen (f)"} onClick={toggleFull}>
                {full ? <ExitFullscreenIcon className="size-6" /> : <FullscreenIcon className="size-6" />}
              </CtlButton>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CtlButton({ label, onClick, children, active }: { label: string; onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={label}
      title={label}
      className={cn("grid size-11 shrink-0 place-items-center rounded-full transition hover:bg-white/15", active && "text-violet-2")}
    >
      {children}
    </button>
  );
}

function Menu({ children }: { children: React.ReactNode }) {
  return <div className="absolute bottom-12 right-0 z-30 min-w-40 rounded-xl border border-white/10 bg-ink-2/95 p-1 shadow-2xl backdrop-blur-xl">{children}</div>;
}

function MenuItem({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("block w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10", active ? "text-violet-2 font-semibold" : "text-soft")}>
      {children}
    </button>
  );
}
