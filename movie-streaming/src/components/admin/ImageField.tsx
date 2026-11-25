"use client";

import { useRef, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

/** Upload to storage (Cloudinary or local) or paste a URL. */
export function ImageField({ label, value, onChange, folder, aspect }: { label: string; value: string; onChange: (v: string) => void; folder: "posters" | "backdrops" | "stills"; aspect: "poster" | "wide" }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", folder);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Upload failed.");
    onChange(data.url);
  };

  return (
    <div>
      <span className="label">{label}</span>
      <div
        className={cn("relative grid cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-ink-3 transition hover:border-violet", aspect === "poster" ? "aspect-[2/3] w-40" : "aspect-video w-full max-w-sm")}
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) upload(f);
        }}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label.toLowerCase()}`}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="px-3 text-center text-xs text-mute">Drop an image or click to upload</span>
        )}
        {busy && <span className="absolute inset-0 grid place-items-center bg-ink/70"><Spinner /></span>}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <input className="field mt-2 h-10 text-sm" placeholder="…or paste an https:// image URL" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} URL`} />
      {error && <p className="mt-1 text-xs text-red-300" role="alert">{error}</p>}
    </div>
  );
}
