"use client";

import { CloseIcon, PlusIcon } from "@/components/ui/Icons";

export type SourceDraft = {
  provider: "VIDEA" | "DIRECT";
  ref: string;
  label: string;
  quality: string;
  language: string;
  isPrimary: boolean;
  subtitles: { language: string; label: string; url: string }[];
};

export const emptySource = (): SourceDraft => ({ provider: "VIDEA", ref: "", label: "Default", quality: "", language: "", isPrimary: false, subtitles: [] });

export function SourcesEditor({ value, onChange, providers }: { value: SourceDraft[]; onChange: (v: SourceDraft[]) => void; providers: { id: string; name: string; adminHint: string }[] }) {
  const set = (i: number, patch: Partial<SourceDraft>) => onChange(value.map((s, n) => (n === i ? { ...s, ...patch } : patch.isPrimary ? { ...s, isPrimary: false } : s)));

  return (
    <div className="space-y-4">
      {value.length === 0 && <p className="text-sm text-mute">No video source yet. Visitors will see “Coming soon” until you add one.</p>}
      {value.map((s, i) => {
        const hint = providers.find((p) => p.id === s.provider)?.adminHint;
        return (
          <fieldset key={i} className="rounded-2xl border border-line bg-ink-3/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <legend className="text-sm font-semibold">Source {i + 1}</legend>
              <button type="button" className="grid size-9 place-items-center rounded-full text-mute hover:bg-white/10 hover:text-white" onClick={() => onChange(value.filter((_, n) => n !== i))} aria-label={`Remove source ${i + 1}`}>
                <CloseIcon className="size-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)]">
              <label>
                <span className="label">Provider</span>
                <select className="field" value={s.provider} onChange={(e) => set(i, { provider: e.target.value as SourceDraft["provider"] })}>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label>
                <span className="label">{s.provider === "VIDEA" ? "Videa embed code or embed URL" : "Video file URL"}</span>
                <textarea className="field min-h-12 font-mono text-[13px]" rows={s.provider === "VIDEA" ? 2 : 1} value={s.ref} onChange={(e) => set(i, { ref: e.target.value })} placeholder={s.provider === "VIDEA" ? '<iframe src="https://videa.hu/…"></iframe>' : "https://cdn.example.com/film.m3u8"} required />
                {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
              </label>
              <label>
                <span className="label">Label</span>
                <input className="field" value={s.label} onChange={(e) => set(i, { label: e.target.value })} maxLength={40} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label><span className="label">Quality</span><input className="field" value={s.quality} onChange={(e) => set(i, { quality: e.target.value })} placeholder="1080p" maxLength={20} /></label>
                <label><span className="label">Audio language</span><input className="field" value={s.language} onChange={(e) => set(i, { language: e.target.value })} placeholder="hu" maxLength={20} /></label>
              </div>
            </div>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="primary-source" checked={s.isPrimary} onChange={() => set(i, { isPrimary: true })} className="size-4 accent-violet" /> Primary source
            </label>

            {s.provider === "DIRECT" && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2 text-sm font-semibold">Subtitles (WebVTT)</p>
                {s.subtitles.map((t, ti) => (
                  <div key={ti} className="mb-2 grid grid-cols-[70px_minmax(0,1fr)_minmax(0,2fr)_auto] gap-2">
                    <input className="field h-10 text-sm" placeholder="en" value={t.language} aria-label="Language code" onChange={(e) => set(i, { subtitles: s.subtitles.map((x, n) => (n === ti ? { ...x, language: e.target.value } : x)) })} />
                    <input className="field h-10 text-sm" placeholder="English" value={t.label} aria-label="Label" onChange={(e) => set(i, { subtitles: s.subtitles.map((x, n) => (n === ti ? { ...x, label: e.target.value } : x)) })} />
                    <input className="field h-10 text-sm" placeholder="https://…/subs.vtt" value={t.url} aria-label="VTT URL" onChange={(e) => set(i, { subtitles: s.subtitles.map((x, n) => (n === ti ? { ...x, url: e.target.value } : x)) })} />
                    <button type="button" className="grid size-10 place-items-center rounded-full text-mute hover:bg-white/10" aria-label="Remove subtitle" onClick={() => set(i, { subtitles: s.subtitles.filter((_, n) => n !== ti) })}><CloseIcon className="size-4" /></button>
                  </div>
                ))}
                <button type="button" className="btn-quiet h-9 text-sm" onClick={() => set(i, { subtitles: [...s.subtitles, { language: "", label: "", url: "" }] })}><PlusIcon className="size-4" /> Add subtitle track</button>
              </div>
            )}
          </fieldset>
        );
      })}
      <button type="button" className="btn-ghost h-10 text-sm" onClick={() => onChange([...value, { ...emptySource(), isPrimary: value.length === 0 }])}>
        <PlusIcon className="size-4" /> Add video source
      </button>
    </div>
  );
}
