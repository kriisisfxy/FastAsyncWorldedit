import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseGrid, PageHeader } from "@/components/browse/BrowseGrid";
import { FilterBar } from "@/components/browse/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { DECADES, readBrowseParams, type SearchParams } from "@/lib/browse";
import { browseMovies, getGenres } from "@/services/catalog";

export const metadata: Metadata = { title: "Movies" };

export default async function MoviesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await readBrowseParams(searchParams);
  const [result, genres] = await Promise.all([browseMovies(params), getGenres()]);
  return (
    <div className="px-[max(4vw,16px)] pt-28">
      <PageHeader eyebrow={`${result.total} titles`} title="Movies" />
      <div className="mb-8">
        <Suspense><FilterBar showQuery genres={genres.map((g) => ({ value: g.slug, label: g.name }))} decades={DECADES} /></Suspense>
      </div>
      <BrowseGrid items={result.items} />
      <Pagination page={result.page} pages={result.pages} params={params.raw} basePath="/movies" />
    </div>
  );
}
