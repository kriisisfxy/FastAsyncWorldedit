import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Reset your password" };

export default function Page() {
  return (
    <>
      <h1 className="font-display text-[34px] font-extrabold leading-tight tracking-[-0.02em]">Reset your password</h1>
      <p className="mb-8 mt-2 text-mute">Enter your email and we’ll send you a link.</p>
      <Suspense>
        <ForgotForm />
      </Suspense>
    </>
  );
}
