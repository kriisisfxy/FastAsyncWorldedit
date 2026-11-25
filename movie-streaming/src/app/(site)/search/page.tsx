import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseGrid, PageHeader } from "@/components/browse/BrowseGrid";
import { FilterBar } from "@/components/browse/FilterBar";
import { MovieCard } from "@/components/media/MovieCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { DECADES, readBrowseParams, type SearchParams } from "@/lib/browse";
import { browseMovies, browseSeries, getGenres } from "@/services/catalog";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await readBrowseParams(searchParams);
  const [movies, series, genres] = await Promise.all([
    browseMovies(params),
    params.q && params.page === 1 ? browseSeries({ ...params, page: 1 }, 6) : Promise.resolve(null),
    getGenres(),
  ]);
  return (
    <div className="px-[max(4vw,16px)] pt-28">
      <PageHeader eyebrow="Search" title={params.q ? `Results for “${params.q}”` : "Search the catalogue"}>
        {params.q ? `${movies.total} film${movies.total === 1 ? "" : "s"}${series?.total ? ` and ${series.total} series` : ""}` : "Find films by title or actor, then narrow down by genre and year."}
      </PageHeader>
      <div className="mb-8">
        <Suspense><FilterBar showQuery genres={genres.map((g) => ({ value: g.slug, label: g.name }))} decades={DECADES} /></Suspense>
      </div>
      {series && series.items.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-display text-xl font-bold">Series</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {series.items.map((s) => <MovieCard key={s.id} item={s} />)}
          </div>
        </section>
      )}
      <BrowseGrid items={movies.items} empty={<EmptyState title="No matches">Check the spelling, try an actor’s name, or remove a filter.</EmptyState>} />
      <Pagination page={movies.page} pages={movies.pages} params={params.raw} basePath="/search" />
    </div>
  );
}
