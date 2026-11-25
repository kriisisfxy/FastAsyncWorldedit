import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Create your account" };

export default function Page() {
  return (
    <>
      <h1 className="font-display text-[34px] font-extrabold leading-tight tracking-[-0.02em]">Create your account</h1>
      <p className="mb-8 mt-2 text-mute">Save films to your list and resume anywhere.</p>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </>
  );
}
