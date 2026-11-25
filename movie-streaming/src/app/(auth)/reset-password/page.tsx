import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Choose a new password" };

export default function Page() {
  return (
    <>
      <h1 className="font-display text-[34px] font-extrabold leading-tight tracking-[-0.02em]">Choose a new password</h1>
      <p className="mb-8 mt-2 text-mute">Make it at least 8 characters, with a letter and a number.</p>
      <Suspense>
        <ResetForm />
      </Suspense>
    </>
  );
}
