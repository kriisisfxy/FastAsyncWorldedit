import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: { default: "Studio", template: "%s · Nocturne Studio" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (user?.role !== "ADMIN") redirect("/login?callbackUrl=/admin");
  return (
    <div className="min-h-dvh lg:flex">
      <Sidebar name={user.name ?? "Admin"} />
      <div className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:py-10">{children}</div>
    </div>
  );
}
