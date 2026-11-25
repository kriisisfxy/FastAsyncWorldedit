"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRef, useState } from "react";
import { Avatar } from "@/components/layout/Navbar";
import { Spinner } from "@/components/ui/Spinner";

export function AvatarUpload({ name, image }: { name: string; image: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { update } = useSession();

  return (
    <div className="flex items-center gap-5">
      <Avatar name={name} image={image} size={88} />
      <div>
        <button className="btn-ghost h-10 text-sm" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? <Spinner /> : "Change photo"}
        </button>
        <p className="mt-1.5 text-xs text-mute">JPG, PNG or WebP, up to 8 MB.</p>
        {error && <p className="mt-1 text-xs text-red-300" role="alert">{error}</p>}
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setError(null);
            const fd = new FormData();
            fd.set("file", file);
            const res = await fetch("/api/me/avatar", { method: "POST", body: fd });
            setBusy(false);
            if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Upload failed.");
            await update();
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}

export function ProfileForm({ name }: { name: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { update } = useSession();

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body: Record<string, string> = { name: String(f.get("name")) };
        if (f.get("newPassword")) {
          if (f.get("newPassword") !== f.get("confirm")) return setMsg({ ok: false, text: "New passwords don’t match." });
          body.currentPassword = String(f.get("currentPassword"));
          body.newPassword = String(f.get("newPassword"));
        }
        setBusy(true);
        const res = await fetch("/api/me/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        setBusy(false);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Could not save." });
        setMsg({ ok: true, text: "Saved." });
        (e.target as HTMLFormElement).querySelectorAll<HTMLInputElement>("input[type=password]").forEach((i) => (i.value = ""));
        await update();
        router.refresh();
      }}
    >
      <label className="sm:col-span-2">
        <span className="label">Display name</span>
        <input name="name" defaultValue={name} className="field" required minLength={2} maxLength={60} />
      </label>
      <label>
        <span className="label">Current password</span>
        <input name="currentPassword" type="password" autoComplete="current-password" className="field" />
      </label>
      <span className="hidden sm:block" />
      <label>
        <span className="label">New password</span>
        <input name="newPassword" type="password" autoComplete="new-password" minLength={8} className="field" />
      </label>
      <label>
        <span className="label">Confirm new password</span>
        <input name="confirm" type="password" autoComplete="new-password" minLength={8} className="field" />
      </label>
      <div className="flex items-center gap-4 sm:col-span-2">
        <button className="btn-violet" disabled={busy}>{busy ? <Spinner /> : "Save changes"}</button>
        {msg && <p className={msg.ok ? "text-sm text-violet-2" : "text-sm text-red-300"} role="status">{msg.text}</p>}
      </div>
    </form>
  );
}
