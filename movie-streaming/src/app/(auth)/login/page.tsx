import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Welcome back" };

export default function Page() {
  return (
    <>
      <h1 className="font-display text-[34px] font-extrabold leading-tight tracking-[-0.02em]">Welcome back</h1>
      <p className="mb-8 mt-2 text-mute">Sign in to pick up where you left off.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
