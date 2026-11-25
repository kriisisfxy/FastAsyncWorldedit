"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

function safeCallback(raw: string | null) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="field" {...rest} />
    </label>
  );
}

function Alert({ kind = "error", children }: { kind?: "error" | "ok"; children: React.ReactNode }) {
  return (
    <p role={kind === "error" ? "alert" : "status"} className={kind === "error" ? "rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/20" : "rounded-xl bg-violet/10 px-4 py-3 text-sm text-violet-2 ring-1 ring-violet/25"}>
      {children}
    </p>
  );
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

export function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const callbackUrl = safeCallback(params.get("callbackUrl"));

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setLoading(true);
        setError(null);
        const res = await signIn("credentials", { email: f.get("email"), password: f.get("password"), redirect: false });
        setLoading(false);
        if (res?.error) {
          setError(res.code === "rate_limited" ? "Too many attempts. Wait a few minutes and try again." : "That email and password don’t match.");
          return;
        }
        router.replace(callbackUrl);
        router.refresh();
      }}
    >
      {params.get("reset") && <Alert kind="ok">Your password was changed. Sign in with the new one.</Alert>}
      {params.get("registered") && <Alert kind="ok">Account created. Sign in to start watching.</Alert>}
      {error && <Alert>{error}</Alert>}
      <Field label="Email" name="email" type="email" autoComplete="email" required autoFocus />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-violet-2 hover:underline">Forgot password?</Link>
      </div>
      <button className="btn-violet h-12 w-full text-base" disabled={loading}>{loading ? <Spinner /> : "Sign in"}</button>
      <p className="pt-2 text-center text-sm text-mute">New to Nocturne? <Link href={`/register${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-semibold text-white hover:text-violet-2">Create an account</Link></p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const email = String(f.get("email"));
        const password = String(f.get("password"));
        if (password !== f.get("confirm")) return setError("The passwords don’t match.");
        setLoading(true);
        setError(null);
        try {
          await post("/api/register", { name: f.get("name"), email, password });
          const res = await signIn("credentials", { email, password, redirect: false });
          if (res?.error) return router.replace("/login?registered=1");
          router.replace(safeCallback(params.get("callbackUrl")));
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      }}
    >
      {error && <Alert>{error}</Alert>}
      <Field label="Name" name="name" autoComplete="name" required minLength={2} maxLength={60} autoFocus />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      <p className="-mt-2 text-xs text-mute">At least 8 characters, with a letter and a number.</p>
      <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      <button className="btn-violet h-12 w-full text-base" disabled={loading}>{loading ? <Spinner /> : "Create account"}</button>
      <p className="pt-2 text-center text-sm text-mute">Already a member? <Link href="/login" className="font-semibold text-white hover:text-violet-2">Sign in</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (sent) return <Alert kind="ok">If an account exists for that email, a reset link is on its way. It expires in one hour.</Alert>;
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
          await post("/api/password/forgot", { email: new FormData(e.currentTarget).get("email") });
          setSent(true);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      }}
    >
      {error && <Alert>{error}</Alert>}
      <Field label="Email" name="email" type="email" autoComplete="email" required autoFocus />
      <button className="btn-violet h-12 w-full text-base" disabled={loading}>{loading ? <Spinner /> : "Send reset link"}</button>
      <p className="text-center text-sm text-mute"><Link href="/login" className="hover:text-white">Back to sign in</Link></p>
    </form>
  );
}

export function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(token ? null : "This reset link is incomplete. Request a new one.");
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        if (f.get("password") !== f.get("confirm")) return setError("The passwords don’t match.");
        setLoading(true);
        setError(null);
        try {
          await post("/api/password/reset", { token, password: f.get("password") });
          router.replace("/login?reset=1");
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      }}
    >
      {error && <Alert>{error} {error.includes("expired") || error.includes("incomplete") ? <Link href="/forgot-password" className="underline">Request a new link</Link> : null}</Alert>}
      <Field label="New password" name="password" type="password" autoComplete="new-password" required minLength={8} autoFocus />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      <button className="btn-violet h-12 w-full text-base" disabled={loading || !token}>{loading ? <Spinner /> : "Set new password"}</button>
    </form>
  );
}
