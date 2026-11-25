"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SearchIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";

type Opt = { value: string; label: string };

export function FilterBar({ genres, showQuery, showGenre = true, decades }: { genres: Opt[]; showQuery?: boolean; showGenre?: boolean; decades: number[] }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "decade") next.delete("year");
    if (key === "year") next.delete("decade");
    next.delete("page");
    start(() => router.replace(`${path}?${next.toString()}`, { scroll: false }));
  };

  useEffect(() => {
    if (!showQuery) return;
    const t = setTimeout(() => (q.trim() !== (params.get("q") ?? "") ? update("q", q.trim()) : undefined), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const select = "h-11 rounded-full border border-line bg-ink-2 px-4 pr-9 text-sm text-white outline-none transition hover:border-white/25 focus:border-violet";
  const year = params.get("year") ?? "";
  const decade = params.get("decade") ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {showQuery && (
        <label className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title or actor" aria-label="Search title or actor" className="h-11 w-full rounded-full border border-line bg-ink-2 pl-11 pr-4 text-sm outline-none transition focus:border-violet" />
        </label>
      )}
      {showGenre && (
        <select aria-label="Genre" className={select} value={params.get("genre") ?? ""} onChange={(e) => update("genre", e.target.value)}>
          <option value="">All genres</option>
          {genres.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      )}
      <select aria-label="Decade" className={select} value={decade} onChange={(e) => update("decade", e.target.value)}>
        <option value="">Any decade</option>
        {decades.map((d) => <option key={d} value={d}>{d}s</option>)}
      </select>
      <input
        aria-label="Release year"
        inputMode="numeric"
        placeholder="Year"
        defaultValue={year}
        key={year}
        onKeyDown={(e) => e.key === "Enter" && update("year", (e.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, 4))}
        onBlur={(e) => e.target.value !== year && update("year", e.target.value.replace(/\D/g, "").slice(0, 4))}
        className="h-11 w-24 rounded-full border border-line bg-ink-2 px-4 text-sm outline-none focus:border-violet"
      />
      <select aria-label="Sort" className={select} value={params.get("sort") ?? "popular"} onChange={(e) => update("sort", e.target.value === "popular" ? "" : e.target.value)}>
        <option value="popular">Most popular</option>
        <option value="rating">Highest rated</option>
        <option value="newest">Newest additions</option>
        <option value="year">Release year</option>
        <option value="title">Title A–Z</option>
      </select>
      {pending && <Spinner />}
    </div>
  );
}
