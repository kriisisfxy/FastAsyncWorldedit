"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Artwork } from "./Artwork";
import { InfoIcon, PlayIcon, StarIcon } from "@/components/ui/Icons";
import { formatRuntime } from "@/lib/utils";
import type { CardItem } from "@/services/catalog";

export function Hero({ items }: { items: CardItem[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % items.length), 9000);
    return () => clearInterval(t);
  }, [items.length, paused]);

  const item = items[i];
  if (!item) return <div className="h-[30vh]" />;
  const detail = item.type === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;
  const watch = item.type === "movie" ? `/watch/movie/${item.slug}` : `/series/${item.slug}#episodes`;
  const runtime = formatRuntime(item.runtime);

  return (
    <section
      className="grain relative isolate flex min-h-[78svh] items-end overflow-hidden pb-[max(9vh,64px)] pt-28 sm:min-h-[86svh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={item.id}
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Artwork src={item.backdropUrl ?? item.posterUrl} alt="" sizes="100vw" priority />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#090909_0%,rgb(9_9_9/0.85)_30%,rgb(9_9_9/0.1)_70%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#090909_0%,transparent_45%,rgb(9_9_9/0.6)_100%)]" />

      <div className="w-full px-[max(4vw,16px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <p className="eyebrow mb-3 flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-violet-2" />
              {item.type === "series" ? "Featured series" : "Featured tonight"}
            </p>
            <h1 className="font-display text-[clamp(40px,7vw,84px)] font-extrabold leading-[0.95] tracking-[-0.03em] text-balance">
              {item.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-soft">
              {item.rating !== null && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                  <span className="rounded bg-gold px-1.5 py-px text-[11px] font-extrabold text-ink">IMDb</span>
                  {item.rating.toFixed(1)}
                  <StarIcon className="size-3.5 text-gold" />
                </span>
              )}
              <span>{item.year}</span>
              {runtime && <span>{runtime}</span>}
              <span>{item.genres.slice(0, 3).join(" · ")}</span>
            </div>
            <p className="mt-5 line-clamp-3 max-w-xl text-[16.5px] leading-relaxed text-soft sm:text-[17px]">{item.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {item.playable ? (
                <Link href={watch} className="btn-primary h-12 px-7 text-base">
                  <PlayIcon className="size-5" /> Watch now
                </Link>
              ) : (
                <span className="btn h-12 bg-white/10 px-7 text-base text-mute">Coming soon</span>
              )}
              <Link href={detail} className="btn-ghost h-12 px-6 text-base">
                <InfoIcon className="size-5" /> More information
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {items.length > 1 && (
          <div className="mt-10 flex gap-2" role="tablist" aria-label="Featured titles">
            {items.map((it, n) => (
              <button
                key={it.id}
                role="tab"
                aria-selected={n === i}
                aria-label={it.title}
                onClick={() => setI(n)}
                className="relative h-1.5 w-10 overflow-hidden rounded-full bg-white/15 transition-all hover:bg-white/30 aria-selected:w-16"
              >
                {n === i && <motion.span layoutId="hero-dot" className="absolute inset-0 rounded-full bg-violet-2" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
