"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminRequest } from "./api";
import { DeleteButton } from "./RowActions";

export function GenreManager({ genres }: { genres: { id: string; name: string; slug: string; movies: number; series: number }[] }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="space-y-6">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            await adminRequest("/api/admin/genres", "POST", { name });
            setName("");
            router.refresh();
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <input className="field max-w-xs" placeholder="New genre name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={40} aria-label="New genre name" />
        <button className="btn-violet">Add genre</button>
        {error && <p className="w-full text-sm text-red-300" role="alert">{error}</p>}
      </form>
      <div className="card divide-y divide-line">
        {genres.map((g) => (
          <div key={g.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <span className="flex-1 font-semibold">{g.name}</span>
            <span className="text-sm text-mute">{g.movies} movies · {g.series} series</span>
            <DeleteButton small url={`/api/admin/genres/${g.id}`} label={g.name} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UserActions({ id, role, disabled, isSelf }: { id: string; role: "USER" | "ADMIN"; disabled: boolean; isSelf: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const patch = async (data: object) => {
    setBusy(true);
    setError(null);
    try {
      await adminRequest(`/api/admin/users/${id}`, "PATCH", data);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (isSelf) return <span className="text-xs text-mute">You</span>;
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <button disabled={busy} className="h-8 rounded-full px-3 text-xs font-semibold text-soft hover:bg-white/10" onClick={() => patch({ role: role === "ADMIN" ? "USER" : "ADMIN" })}>
        {role === "ADMIN" ? "Remove admin" : "Make admin"}
      </button>
      <button disabled={busy} className="h-8 rounded-full px-3 text-xs font-semibold text-soft hover:bg-white/10" onClick={() => patch({ disabled: !disabled })}>
        {disabled ? "Enable" : "Disable"}
      </button>
      <DeleteButton small url={`/api/admin/users/${id}`} label="this user" />
      {error && <span className="w-full text-right text-xs text-red-300">{error}</span>}
    </div>
  );
}
