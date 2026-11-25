import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseGrid, PageHeader } from "@/components/browse/BrowseGrid";
import { FilterBar } from "@/components/browse/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { DECADES, readBrowseParams, type SearchParams } from "@/lib/browse";
import { browseSeries, getGenres } from "@/services/catalog";

export const metadata: Metadata = { title: "Series" };

export default async function SeriesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await readBrowseParams(searchParams);
  const [result, genres] = await Promise.all([browseSeries(params), getGenres()]);
  return (
    <div className="px-[max(4vw,16px)] pt-28">
      <PageHeader eyebrow={`${result.total} series`} title="Series" />
      <div className="mb-8">
        <Suspense><FilterBar showQuery genres={genres.map((g) => ({ value: g.slug, label: g.name }))} decades={DECADES} /></Suspense>
      </div>
      <BrowseGrid items={result.items} empty={<EmptyState title="No series match">Try another genre or decade.</EmptyState>} />
      <Pagination page={result.page} pages={result.pages} params={params.raw} basePath="/series" />
    </div>
  );
}
