"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CloseIcon, PlusIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { adminRequest } from "./api";
import { ImageField } from "./ImageField";
import { SourcesEditor, type SourceDraft } from "./SourcesEditor";

export type CastDraft = { name: string; role: "ACTOR" | "DIRECTOR" | "WRITER" | "PRODUCER" | "COMPOSER"; character: string };

export type MovieDraft = {
  id?: string;
  title: string; slug: string; tagline: string; description: string; releaseDate: string; year: string; runtime: string;
  imdbRating: string; ageRating: string; posterUrl: string; backdropUrl: string; featured: boolean; published: boolean;
  genreIds: string[]; cast: CastDraft[]; sources: SourceDraft[];
};

export const emptyMovie: MovieDraft = {
  title: "", slug: "", tagline: "", description: "", releaseDate: "", year: String(new Date().getFullYear()), runtime: "",
  imdbRating: "", ageRating: "", posterUrl: "", backdropUrl: "", featured: false, published: true, genreIds: [], cast: [], sources: [],
};

const num = (v: string) => (v.trim() === "" ? null : Number(v));

export function MovieForm({ initial, genres, providers }: { initial: MovieDraft; genres: { id: string; name: string }[]; providers: { id: string; name: string; adminHint: string }[] }) {
  const [m, setM] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const set = <K extends keyof MovieDraft>(k: K, v: MovieDraft[K]) => { setM((x) => ({ ...x, [k]: v })); setSaved(false); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      title: m.title, slug: m.slug || undefined, tagline: m.tagline || null, description: m.description,
      releaseDate: m.releaseDate || null, year: Number(m.year), runtime: num(m.runtime), imdbRating: num(m.imdbRating),
      ageRating: m.ageRating || null, posterUrl: m.posterUrl, backdropUrl: m.backdropUrl, featured: m.featured, published: m.published,
      genreIds: m.genreIds,
      cast: m.cast.filter((c) => c.name.trim()).map((c) => ({ ...c, character: c.character || null })),
      sources: m.sources.map((s) => ({ ...s, quality: s.quality || null, language: s.language || null, subtitles: s.subtitles.filter((t) => t.url.trim()) })),
    };
    try {
      const res = await adminRequest<{ id: string; slug: string }>(m.id ? `/api/admin/movies/${m.id}` : "/api/admin/movies", m.id ? "PUT" : "POST", body);
      setSaved(true);
      if (!m.id) router.replace(`/admin/movies/${res.id}`);
      else { set("slug", res.slug); setSaved(true); }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-8">
          <Section title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="label">Title *</span><input className="field" value={m.title} onChange={(e) => set("title", e.target.value)} required maxLength={200} /></label>
              <label><span className="label">URL slug</span><input className="field font-mono text-sm" value={m.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="generated from the title" maxLength={80} /></label>
              <label><span className="label">Tagline</span><input className="field" value={m.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={200} /></label>
              <label className="sm:col-span-2"><span className="label">Description *</span><textarea className="field" rows={5} value={m.description} onChange={(e) => set("description", e.target.value)} required maxLength={5000} /></label>
              <label><span className="label">Release date</span><input type="date" className="field" value={m.releaseDate} onChange={(e) => { set("releaseDate", e.target.value); if (e.target.value) set("year", e.target.value.slice(0, 4)); }} /></label>
              <label><span className="label">Year *</span><input type="number" className="field" value={m.year} onChange={(e) => set("year", e.target.value)} min={1870} max={2100} required /></label>
              <label><span className="label">Runtime (minutes)</span><input type="number" className="field" value={m.runtime} onChange={(e) => set("runtime", e.target.value)} min={1} max={1000} /></label>
              <div className="grid grid-cols-2 gap-4">
                <label><span className="label">IMDb rating</span><input type="number" step="0.1" min={0} max={10} className="field" value={m.imdbRating} onChange={(e) => set("imdbRating", e.target.value)} /></label>
                <label><span className="label">Age rating</span><input className="field" value={m.ageRating} onChange={(e) => set("ageRating", e.target.value)} placeholder="16" maxLength={10} /></label>
              </div>
            </div>
          </Section>

          <Section title="Genres">
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => {
                const on = m.genreIds.includes(g.id);
                return (
                  <button type="button" key={g.id} aria-pressed={on} onClick={() => set("genreIds", on ? m.genreIds.filter((x) => x !== g.id) : [...m.genreIds, g.id])} className={cn("chip", on && "chip-on")}>
                    {g.name}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Cast & crew">
            <div className="space-y-2">
              {m.cast.map((c, i) => (
                <div key={i} className="grid grid-cols-[minmax(0,1.3fr)_130px_minmax(0,1fr)_auto] gap-2">
                  <input className="field h-11" placeholder="Name" value={c.name} aria-label="Name" onChange={(e) => set("cast", m.cast.map((x, n) => (n === i ? { ...x, name: e.target.value } : x)))} />
                  <select className="field h-11" value={c.role} aria-label="Role" onChange={(e) => set("cast", m.cast.map((x, n) => (n === i ? { ...x, role: e.target.value as CastDraft["role"] } : x)))}>
                    {["ACTOR", "DIRECTOR", "WRITER", "PRODUCER", "COMPOSER"].map((r) => <option key={r} value={r}>{r[0] + r.slice(1).toLowerCase()}</option>)}
                  </select>
                  <input className="field h-11" placeholder={c.role === "ACTOR" ? "Character" : "—"} disabled={c.role !== "ACTOR"} value={c.character} aria-label="Character" onChange={(e) => set("cast", m.cast.map((x, n) => (n === i ? { ...x, character: e.target.value } : x)))} />
                  <button type="button" className="grid size-11 place-items-center rounded-full text-mute hover:bg-white/10" aria-label="Remove" onClick={() => set("cast", m.cast.filter((_, n) => n !== i))}><CloseIcon className="size-4" /></button>
                </div>
              ))}
              <button type="button" className="btn-ghost h-10 text-sm" onClick={() => set("cast", [...m.cast, { name: "", role: "ACTOR", character: "" }])}><PlusIcon className="size-4" /> Add person</button>
            </div>
          </Section>

          <Section title="Video sources">
            <SourcesEditor value={m.sources} onChange={(v) => set("sources", v)} providers={providers} />
          </Section>
        </div>

        <div className="space-y-8">
          <Section title="Visibility">
            <Toggle label="Published" hint="Visible to viewers" checked={m.published} onChange={(v) => set("published", v)} />
            <Toggle label="Featured on homepage" hint="Shown in the hero carousel" checked={m.featured} onChange={(v) => set("featured", v)} />
          </Section>
          <Section title="Artwork">
            <div className="space-y-5">
              <ImageField label="Poster (2:3)" value={m.posterUrl} onChange={(v) => set("posterUrl", v)} folder="posters" aspect="poster" />
              <ImageField label="Backdrop (16:9)" value={m.backdropUrl} onChange={(v) => set("backdropUrl", v)} folder="backdrops" aspect="wide" />
            </div>
          </Section>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-4 border-t border-line bg-ink/90 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <button className="btn-violet" disabled={saving}>{saving ? <Spinner /> : m.id ? "Save changes" : "Create movie"}</button>
        {m.id && m.slug && <a href={`/movie/${m.slug}`} target="_blank" className="btn-quiet">View on site ↗</a>}
        {saved && !error && <span className="text-sm text-violet-2" role="status">Saved</span>}
        {error && <span className="text-sm text-red-300" role="alert">{error}</span>}
      </div>
    </form>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span>
        <span className="block text-[15px] font-medium">{label}</span>
        {hint && <span className="block text-xs text-mute">{hint}</span>}
      </span>
      <span className="relative">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="block h-6 w-11 rounded-full bg-white/15 transition peer-checked:bg-violet peer-focus-visible:ring-2 peer-focus-visible:ring-violet-2" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
