import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/browse/BrowseGrid";
import { Artwork } from "@/components/media/Artwork";
import { genresWithCounts } from "@/services/catalog";

export const metadata: Metadata = { title: "Genres" };
export const dynamic = "force-dynamic";

export default async function GenresPage() {
  const genres = (await genresWithCounts()).filter((g) => g.count > 0);
  return (
    <div className="px-[max(4vw,16px)] pt-28">
      <PageHeader eyebrow="Browse" title="Genres" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {genres.map((g) => (
          <Link key={g.id} href={`/genres/${g.slug}`} className="group relative isolate block aspect-[16/8] overflow-hidden rounded-2xl ring-1 ring-white/5 transition hover:ring-violet/60">
            <Artwork src={g.image} alt="" sizes="(max-width: 640px) 100vw, 25vw" className="-z-10 transition duration-700 group-hover:scale-105" fallbackTitle="" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-ink via-ink/60 to-violet-deep/20" />
            <div className="flex h-full flex-col justify-end p-5">
              <h2 className="font-display text-2xl font-extrabold tracking-tight">{g.name}</h2>
              <p className="text-sm text-soft">{g.count} title{g.count === 1 ? "" : "s"}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
