"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { adminRequest } from "./api";
import { ImageField } from "./ImageField";
import { Section, Toggle } from "./MovieForm";

export type SeriesDraft = {
  id?: string; title: string; slug: string; description: string; startYear: string; endYear: string; imdbRating: string;
  posterUrl: string; backdropUrl: string; featured: boolean; published: boolean; genreIds: string[];
};

export const emptySeries: SeriesDraft = {
  title: "", slug: "", description: "", startYear: String(new Date().getFullYear()), endYear: "", imdbRating: "",
  posterUrl: "", backdropUrl: "", featured: false, published: true, genreIds: [],
};

export function SeriesForm({ initial, genres }: { initial: SeriesDraft; genres: { id: string; name: string }[] }) {
  const [s, setS] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const set = <K extends keyof SeriesDraft>(k: K, v: SeriesDraft[K]) => { setS((x) => ({ ...x, [k]: v })); setSaved(false); };

  return (
    <form
      className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
          const body = {
            title: s.title, slug: s.slug || undefined, description: s.description, startYear: Number(s.startYear),
            endYear: s.endYear ? Number(s.endYear) : null, imdbRating: s.imdbRating ? Number(s.imdbRating) : null,
            posterUrl: s.posterUrl, backdropUrl: s.backdropUrl, featured: s.featured, published: s.published, genreIds: s.genreIds,
          };
          const res = await adminRequest<{ id: string; slug: string }>(s.id ? `/api/admin/series/${s.id}` : "/api/admin/series", s.id ? "PUT" : "POST", body);
          setSaved(true);
          if (!s.id) router.replace(`/admin/series/${res.id}`);
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="space-y-8">
        <Section title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="label">Title *</span><input className="field" value={s.title} onChange={(e) => set("title", e.target.value)} required /></label>
            <label className="sm:col-span-2"><span className="label">Description *</span><textarea className="field" rows={4} value={s.description} onChange={(e) => set("description", e.target.value)} required /></label>
            <label><span className="label">First year *</span><input type="number" className="field" value={s.startYear} onChange={(e) => set("startYear", e.target.value)} required min={1870} max={2100} /></label>
            <label><span className="label">Last year</span><input type="number" className="field" value={s.endYear} onChange={(e) => set("endYear", e.target.value)} placeholder="ongoing" min={1870} max={2100} /></label>
            <label><span className="label">IMDb rating</span><input type="number" step="0.1" min={0} max={10} className="field" value={s.imdbRating} onChange={(e) => set("imdbRating", e.target.value)} /></label>
            <label><span className="label">URL slug</span><input className="field font-mono text-sm" value={s.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="generated from the title" /></label>
          </div>
        </Section>
        <Section title="Genres">
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => {
              const on = s.genreIds.includes(g.id);
              return <button type="button" key={g.id} aria-pressed={on} onClick={() => set("genreIds", on ? s.genreIds.filter((x) => x !== g.id) : [...s.genreIds, g.id])} className={cn("chip", on && "chip-on")}>{g.name}</button>;
            })}
          </div>
        </Section>
        <div className="flex items-center gap-4">
          <button className="btn-violet" disabled={saving}>{saving ? <Spinner /> : s.id ? "Save series" : "Create series"}</button>
          {saved && <span className="text-sm text-violet-2">Saved</span>}
          {error && <span className="text-sm text-red-300" role="alert">{error}</span>}
        </div>
      </div>
      <div className="space-y-8">
        <Section title="Visibility">
          <Toggle label="Published" checked={s.published} onChange={(v) => set("published", v)} />
          <Toggle label="Featured on homepage" checked={s.featured} onChange={(v) => set("featured", v)} />
        </Section>
        <Section title="Artwork">
          <div className="space-y-5">
            <ImageField label="Poster (2:3)" value={s.posterUrl} onChange={(v) => set("posterUrl", v)} folder="posters" aspect="poster" />
            <ImageField label="Backdrop (16:9)" value={s.backdropUrl} onChange={(v) => set("backdropUrl", v)} folder="backdrops" aspect="wide" />
          </div>
        </Section>
      </div>
    </form>
  );
}
