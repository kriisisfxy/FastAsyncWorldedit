"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { adminRequest } from "./api";

/** Inline toggle for featured/published flags in list views. */
export function FlagToggle({ url, field, value, label }: { url: string; field: "featured" | "published"; value: boolean; label: string }) {
  const [on, setOn] = useState(value);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={busy}
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={async () => {
        setBusy(true);
        setOn(!on);
        try {
          await adminRequest(url, "PATCH", { [field]: !on });
          router.refresh();
        } catch {
          setOn(on);
        } finally {
          setBusy(false);
        }
      }}
      className={cn("h-7 rounded-full px-3 text-xs font-semibold transition", on ? "bg-violet/20 text-violet-2 ring-1 ring-violet/40" : "bg-white/5 text-mute hover:text-white")}
    >
      {on ? (field === "featured" ? "Featured" : "Live") : field === "featured" ? "Feature" : "Hidden"}
    </button>
  );
}

/** Two-step delete so nothing is removed by a stray click. */
export function DeleteButton({ url, label, redirectTo, small }: { url: string; label: string; redirectTo?: string; small?: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  if (!confirm) {
    return (
      <button type="button" className={small ? "h-8 rounded-full px-3 text-xs font-semibold text-red-300 hover:bg-red-500/10" : "btn-danger"} onClick={() => setConfirm(true)}>
        Delete
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-xs text-soft">Delete {label}?</span>
      <button
        type="button"
        disabled={busy}
        className="h-8 rounded-full bg-red-500 px-3 text-xs font-bold text-white hover:bg-red-400"
        onClick={async () => {
          setBusy(true);
          try {
            await adminRequest(url, "DELETE");
            if (redirectTo) router.push(redirectTo);
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        Yes, delete
      </button>
      <button type="button" className="h-8 rounded-full px-3 text-xs text-mute hover:text-white" onClick={() => setConfirm(false)}>Cancel</button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </span>
  );
}
