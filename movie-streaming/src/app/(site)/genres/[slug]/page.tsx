import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BrowseGrid, PageHeader } from "@/components/browse/BrowseGrid";
import { FilterBar } from "@/components/browse/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { DECADES, readBrowseParams, type SearchParams } from "@/lib/browse";
import { db } from "@/lib/db";
import { browseMovies } from "@/services/catalog";

type Props = { params: Promise<{ slug: string }>; searchParams: SearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const genre = await db.genre.findUnique({ where: { slug: (await params).slug } });
  return { title: genre?.name ?? "Genre" };
}

export default async function GenrePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const genre = await db.genre.findUnique({ where: { slug } });
  if (!genre) notFound();
  const bp = await readBrowseParams(searchParams);
  const result = await browseMovies({ ...bp, genre: slug });
  return (
    <div className="px-[max(4vw,16px)] pt-28">
      <PageHeader eyebrow={`${result.total} films`} title={genre.name} />
      <div className="mb-8">
        <Suspense><FilterBar showGenre={false} genres={[]} decades={DECADES} /></Suspense>
      </div>
      <BrowseGrid items={result.items} />
      <Pagination page={result.page} pages={result.pages} params={bp.raw} basePath={`/genres/${slug}`} />
    </div>
  );
}
