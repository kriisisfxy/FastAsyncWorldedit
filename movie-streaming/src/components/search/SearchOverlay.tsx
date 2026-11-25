"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Artwork } from "@/components/media/Artwork";
import { CloseIcon, SearchIcon, StarIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import type { CardItem } from "@/services/catalog";

type Results = { movies: CardItem[]; series: CardItem[]; actors: { id: string; name: string; count: number }[] };
const EMPTY: Results = { movies: [], series: [], actors: [] };

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    setTimeout(() => input.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Debounced live search; aborts stale requests so results never arrive out of order.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setRes(EMPTY);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (!r.ok) throw new Error();
        setRes(await r.json());
        setError(false);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError(true);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  const all = [...res.movies, ...res.series];
  const term = q.trim();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-ink/90 backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className="mx-auto max-w-5xl px-[max(4vw,16px)] pb-20 pt-6 sm:pt-14">
            <div className="flex items-center gap-3">
              <form
                className="relative flex-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (term) go(`/search?q=${encodeURIComponent(term)}`);
                }}
              >
                <SearchIcon className="pointer-events-none absolute left-5 top-1/2 size-6 -translate-y-1/2 text-mute" />
                <input
                  ref={input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Titles, actors, directors…"
                  className="h-16 w-full rounded-2xl border border-line bg-ink-2 pl-14 pr-12 font-display text-xl font-semibold tracking-[-0.01em] text-white outline-none transition placeholder:font-normal placeholder:text-mute/60 focus:border-violet focus:ring-4 focus:ring-violet/20 sm:text-2xl"
                  aria-label="Search titles and people"
                  enterKeyHint="search"
                />
                {loading && <Spinner className="absolute right-5 top-1/2 -translate-y-1/2" />}
              </form>
              <button onClick={onClose} className="grid size-12 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20" aria-label="Close search">
                <CloseIcon className="size-5" />
              </button>
            </div>

            <div className="mt-8" aria-live="polite">
              {term.length < 2 && <p className="text-mute">Start typing to search the whole catalogue. Press Enter for the full results page with filters.</p>}
              {error && <p className="text-red-300">Search is unavailable right now. Please try again.</p>}
              {term.length >= 2 && !loading && !error && !all.length && !res.actors.length && (
                <p className="text-mute">Nothing matches “{term}”. Try a different spelling or an actor’s name.</p>
              )}

              {res.actors.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-3 text-sm font-semibold text-mute">People</h3>
                  <div className="flex flex-wrap gap-2">
                    {res.actors.map((a) => (
                      <button key={a.id} onClick={() => go(`/search?q=${encodeURIComponent(a.name)}`)} className="chip">
                        {a.name} <span className="ml-2 text-mute">{a.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {all.length > 0 && (
                <>
                  <h3 className="mb-3 text-sm font-semibold text-mute">Titles</h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {all.map((m, i) => (
                      <motion.li key={m.type + m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}>
                        <Link
                          href={m.type === "movie" ? `/movie/${m.slug}` : `/series/${m.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-4 rounded-2xl p-2 pr-4 transition hover:bg-white/5 focus-visible:bg-white/5"
                        >
                          <div className="relative h-[84px] w-14 shrink-0 overflow-hidden rounded-lg bg-ink-3">
                            <Artwork src={m.posterUrl} alt="" sizes="56px" fallbackTitle="" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{m.title}</p>
                            <p className="mt-0.5 flex items-center gap-2 text-sm text-mute">
                              {m.year}
                              {m.type === "series" && <span className="text-violet-2">Series</span>}
                              {m.rating !== null && <span className="inline-flex items-center gap-1 text-gold"><StarIcon className="size-3" />{m.rating.toFixed(1)}</span>}
                            </p>
                            <p className="truncate text-sm text-mute">{m.genres.join(" · ")}</p>
                          </div>
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                  <button onClick={() => go(`/search?q=${encodeURIComponent(term)}`)} className="btn-quiet mt-5 text-violet-2">
                    See all results and filters →
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
