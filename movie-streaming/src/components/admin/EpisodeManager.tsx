"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlusIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { adminRequest } from "./api";
import { ImageField } from "./ImageField";
import { DeleteButton } from "./RowActions";
import { SourcesEditor, type SourceDraft } from "./SourcesEditor";

type Episode = { id: string; number: number; title: string; description: string | null; runtime: number | null; stillUrl: string | null; sources: SourceDraft[] };
type Season = { id: string; number: number; title: string | null; episodes: Episode[] };
type Providers = { id: string; name: string; adminHint: string }[];

export function EpisodeManager({ seriesId, seasons, providers }: { seriesId: string; seasons: Season[]; providers: Providers }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null); // episode id or "new:<seasonId>"

  const addSeason = async () => {
    setError(null);
    const number = (seasons.at(-1)?.number ?? 0) + 1;
    try {
      await adminRequest(`/api/admin/series/${seriesId}/seasons`, "POST", { number });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {seasons.length === 0 && <p className="text-mute">No seasons yet. Add the first one to start adding episodes.</p>}
      {seasons.map((season) => (
        <div key={season.id} className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h3 className="font-display text-lg font-bold">Season {season.number}{season.title && <span className="ml-2 text-sm font-normal text-mute">{season.title}</span>}</h3>
            <div className="flex items-center gap-2">
              <button className="btn-ghost h-9 text-sm" onClick={() => setEditing(`new:${season.id}`)}><PlusIcon className="size-4" /> Episode</button>
              <DeleteButton small url={`/api/admin/seasons/${season.id}`} label={`season ${season.number} and its episodes`} />
            </div>
          </div>
          <ul className="divide-y divide-line">
            {season.episodes.map((ep) => (
              <li key={ep.id} className="px-5 py-3">
                {editing === ep.id ? (
                  <EpisodeForm seasonId={season.id} initial={ep} providers={providers} onDone={() => setEditing(null)} />
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-8 font-display text-lg font-bold text-mute">{ep.number}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{ep.title}</p>
                      <p className="text-xs text-mute">{ep.sources.length ? `${ep.sources.length} source${ep.sources.length > 1 ? "s" : ""} · ${ep.sources.map((s) => s.provider).join(", ")}` : "No source"}{ep.runtime ? ` · ${ep.runtime} min` : ""}</p>
                    </div>
                    <button className="h-8 rounded-full px-3 text-xs font-semibold text-soft hover:bg-white/10" onClick={() => setEditing(ep.id)}>Edit</button>
                    <DeleteButton small url={`/api/admin/episodes/${ep.id}`} label={`episode ${ep.number}`} />
                  </div>
                )}
              </li>
            ))}
            {editing === `new:${season.id}` && (
              <li className="px-5 py-4">
                <EpisodeForm
                  seasonId={season.id}
                  initial={{ id: "", number: (season.episodes.at(-1)?.number ?? 0) + 1, title: "", description: "", runtime: null, stillUrl: "", sources: [] }}
                  providers={providers}
                  onDone={() => setEditing(null)}
                />
              </li>
            )}
            {season.episodes.length === 0 && editing !== `new:${season.id}` && <li className="px-5 py-4 text-sm text-mute">No episodes yet.</li>}
          </ul>
        </div>
      ))}
      <button className="btn-ghost" onClick={addSeason}><PlusIcon className="size-4" /> Add season</button>
      {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
    </div>
  );
}

function EpisodeForm({ seasonId, initial, providers, onDone }: { seasonId: string; initial: Episode; providers: Providers; onDone: () => void }) {
  const [ep, setEp] = useState({ ...initial, description: initial.description ?? "", runtime: initial.runtime ? String(initial.runtime) : "", stillUrl: initial.stillUrl ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const body = {
          seasonId, number: Number(ep.number), title: ep.title, description: ep.description || null,
          runtime: ep.runtime ? Number(ep.runtime) : null, stillUrl: ep.stillUrl,
          sources: ep.sources.map((s) => ({ ...s, quality: s.quality || null, language: s.language || null, subtitles: s.subtitles.filter((t) => t.url.trim()) })),
        };
        try {
          await adminRequest(initial.id ? `/api/admin/episodes/${initial.id}` : "/api/admin/episodes", initial.id ? "PUT" : "POST", body);
          onDone();
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[90px_minmax(0,1fr)_120px]">
        <label><span className="label">No.</span><input type="number" className="field" value={ep.number} min={0} onChange={(e) => setEp({ ...ep, number: Number(e.target.value) })} required /></label>
        <label><span className="label">Title *</span><input className="field" value={ep.title} onChange={(e) => setEp({ ...ep, title: e.target.value })} required /></label>
        <label><span className="label">Minutes</span><input type="number" className="field" value={ep.runtime} onChange={(e) => setEp({ ...ep, runtime: e.target.value })} /></label>
      </div>
      <label className="block"><span className="label">Description</span><textarea className="field" rows={2} value={ep.description} onChange={(e) => setEp({ ...ep, description: e.target.value })} /></label>
      <ImageField label="Still image (16:9)" value={ep.stillUrl} onChange={(v) => setEp({ ...ep, stillUrl: v })} folder="stills" aspect="wide" />
      <SourcesEditor value={ep.sources} onChange={(v) => setEp({ ...ep, sources: v })} providers={providers} />
      <div className="flex items-center gap-3">
        <button className="btn-violet h-10 text-sm" disabled={busy}>{busy ? <Spinner /> : initial.id ? "Save episode" : "Add episode"}</button>
        <button type="button" className="btn-quiet h-10 text-sm" onClick={onDone}>Cancel</button>
        {error && <span className="text-sm text-red-300" role="alert">{error}</span>}
      </div>
    </form>
  );
}
