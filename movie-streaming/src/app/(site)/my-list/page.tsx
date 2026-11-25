import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrowseGrid, PageHeader } from "@/components/browse/BrowseGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { currentUser } from "@/lib/session";
import { watchlist } from "@/services/library";

export const metadata: Metadata = { title: "My list" };

export default async function MyListPage() {
  const me = await currentUser();
  if (!me) redirect("/login?callbackUrl=/my-list");
  const items = await watchlist(me.id);
  return (
    <div className="px-[max(4vw,16px)] pt-28">
      <PageHeader eyebrow={`${items.length} saved`} title="My list" />
      <BrowseGrid
        items={items}
        empty={<EmptyState title="Your list is empty">Press <b className="text-white">My list</b> on any film to save it for later. <Link href="/movies" className="text-violet-2 hover:underline">Browse movies</Link></EmptyState>}
      />
    </div>
  );
}
